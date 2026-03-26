import { WatchPartyStatus } from "@prisma/client";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

vi.mock("~/server/services/email", () => ({
    sendWatchPartyInvitations: vi.fn(),
}));

import { watchPartyRouter, deliverWatchPartyInvitations } from "./watchParty";
import { sendWatchPartyInvitations } from "~/server/services/email";
import { getPersonName, getPartyName } from "./watchParty.utils";
import { generateUniqueCode } from "./watchParty";
import { mapWatchPartyDetail } from "./watchParty.utils";

describe("watchPartyRouter.join", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockCtx = {
            user: {
                id: "user-2",
                email: "user-2@example.com",
            },
            db: {
                watchParty: {
                    findUnique: vi.fn(),
                    update: vi.fn(),
                },
            },
        };
    });

    it("allows a user to join when the watch party is open", async () => {
        mockCtx.db.watchParty.findUnique.mockResolvedValue({
            id: "party-1",
            hostUserId: "user-1",
            showtimeId: "showtime-1",
            status: WatchPartyStatus.OPEN,
            participants: [],
        });
        mockCtx.db.watchParty.update.mockResolvedValue({});

        const caller = watchPartyRouter.createCaller(mockCtx);
        const result = await caller.join({ inviteCode: "abc1234" });

        expect(result).toEqual({
            id: "party-1",
            joined: true,
        });
        expect(mockCtx.db.watchParty.findUnique).toHaveBeenCalledWith({
            where: { inviteCode: "ABC1234" },
            include: expect.any(Object),
        });
        expect(mockCtx.db.watchParty.update).toHaveBeenCalledWith({
            where: { id: "party-1" },
            data: {
                participants: {
                    connect: {
                        id: "user-2",
                    },
                },
            },
        });
    });

    it.each([WatchPartyStatus.CLOSED, WatchPartyStatus.CONFIRMED])(
        "rejects new joins when the watch party status is %s",
        async (status) => {
            mockCtx.db.watchParty.findUnique.mockResolvedValue({
                id: "party-1",
                hostUserId: "user-1",
                showtimeId: "showtime-1",
                status,
                participants: [],
            });

            const caller = watchPartyRouter.createCaller(mockCtx);

            await expect(
                caller.join({ inviteCode: "abc1234" })
            ).rejects.toMatchObject({
                code: "BAD_REQUEST",
                message: "This watch party is not open and cannot be joined.",
            });

            expect(mockCtx.db.watchParty.update).not.toHaveBeenCalled();
        }
    );

    it("rejects the host from joining their own watch party", async () => {
        mockCtx.db.watchParty.findUnique.mockResolvedValue({
            id: "party-1",
            hostUserId: "user-2",
            showtimeId: "showtime-1",
            status: WatchPartyStatus.OPEN,
            participants: [],
        });

        const caller = watchPartyRouter.createCaller(mockCtx);

        await expect(
            caller.join({ inviteCode: "abc1234" })
        ).rejects.toMatchObject({
            code: "BAD_REQUEST",
            message: "You cannot join your own watch party.",
        });

        expect(mockCtx.db.watchParty.update).not.toHaveBeenCalled();
    });

    it("rejects a user who already joined the watch party", async () => {
        mockCtx.db.watchParty.findUnique.mockResolvedValue({
            id: "party-1",
            hostUserId: "user-1",
            showtimeId: "showtime-1",
            status: WatchPartyStatus.CONFIRMED,
            participants: [{ id: "user-2" }],
        });

        const caller = watchPartyRouter.createCaller(mockCtx);

        await expect(
            caller.join({ inviteCode: "abc1234" })
        ).rejects.toMatchObject({
            code: "BAD_REQUEST",
            message: "You have already joined this watch party.",
        });

        expect(mockCtx.db.watchParty.update).not.toHaveBeenCalled();
    });
});

describe("deliverWatchPartyInvitations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("sends invitations to the provided email addresses", async () => {
        const emails = ["user-3@example.com", "user-4@example.com"];
        const host = {
            id: "user-1",
            email: "john@example.com",
            firstName: "John",
            lastName: "Doe",
        };
        const inviteCode = "ABC1234";
        const showtime = {
            id: "showtime-1",
            title: "Example Showtime",
            startTime: new Date("2026-01-15T19:00:00Z"),
            movie: {
                title: "Example Movie",
                posterUrl: "https://example.com/poster.jpg",
            },
        };

        await deliverWatchPartyInvitations({
            emails,
            host,
            inviteCode,
            showtime,
        });

        expect(sendWatchPartyInvitations).toHaveBeenCalledTimes(1);
        expect(sendWatchPartyInvitations).toHaveBeenCalledWith({
            emails,
            hostName: "John Doe",
            movieTitle: "Example Movie",
            moviePosterUrl: "https://example.com/poster.jpg",
            showDate: "January 15, 2026",
            showTime: "1:00 PM",
            inviteCode,
        });
    });

    it("does not send invitations when host is missing", async () => {
        const emails = ["user-3@example.com"];
        const inviteCode = "ABC1234";
        const showtime = {
            id: "showtime-1",
            title: "Example Showtime",
            startTime: new Date("2026-01-15T19:00:00Z"),
            movie: {
                title: "Example Movie",
                posterUrl: "https://example.com/poster.jpg",
            },
        };

        await deliverWatchPartyInvitations({
            emails,
            host: null,
            inviteCode,
            showtime,
        });

        expect(sendWatchPartyInvitations).not.toHaveBeenCalled();
    });

    it("does not send invitations when showtime is missing", async () => {
        const emails = ["user-3@example.com"];
        const host = {
            id: "user-1",
            email: "john@example.com",
            firstName: "John",
            lastName: "Doe",
        };
        const inviteCode = "ABC1234";

        await deliverWatchPartyInvitations({
            emails,
            host,
            inviteCode,
            showtime: null,
        });

        expect(sendWatchPartyInvitations).not.toHaveBeenCalled();
    });

    it("trims whitespace when only one name part is present", async () => {
        const emails = ["user@example.com"];
        const inviteCode = "ABC1234";

        const host = {
            id: "user-1",
            email: "john@example.com",
            firstName: "",
            lastName: "Doe",
        };

        const showtime = {
            id: "showtime-1",
            title: "Example Showtime",
            startTime: new Date("2026-01-15T19:00:00Z"),
            movie: {
                title: "Example Movie",
                posterUrl: "https://example.com/poster.jpg",
            },
        };

        await deliverWatchPartyInvitations({
            emails,
            host,
            inviteCode,
            showtime,
        });

        expect(sendWatchPartyInvitations).toHaveBeenCalledWith({
            emails,
            hostName: "Doe",
            movieTitle: "Example Movie",
            moviePosterUrl: "https://example.com/poster.jpg",
            showDate: "January 15, 2026",
            showTime: "1:00 PM",
            inviteCode,
        });
    });

    it("falls back to email when name is empty", async () => {
        const emails = ["user@example.com"];
        const inviteCode = "ABC1234";

        const host = {
            id: "user-1",
            email: "john@example.com",
            firstName: "",
            lastName: "",
        };

        const showtime = {
            id: "showtime-1",
            title: "Example Showtime",
            startTime: new Date("2026-01-15T19:00:00Z"),
            movie: {
                title: "Example Movie",
                posterUrl: "https://example.com/poster.jpg",
            },
        };

        await deliverWatchPartyInvitations({
            emails,
            host,
            inviteCode,
            showtime,
        });

        expect(sendWatchPartyInvitations).toHaveBeenCalledWith(
            expect.objectContaining({
                hostName: "john@example.com", 
            })
        );
    });
});

describe("Get person name", () => {
    beforeAll(() => {
        vi.unmock("./watchParty.utils");
    });

    afterAll(() => {
        vi.resetModules();
    });

    it("returns the person's full name when both first and last names are provided", () => {
        const person = {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
        };
        expect(getPersonName(person)).toBe("John Doe");
    });

    it("returns null for empty names (kills >= 0 mutant)", () => {
        const person = {
            firstName: "",
            lastName: "",
            email: "nobody@example.com",
        };
        expect(getPersonName(person)).toBeNull();
    });
});

describe("Get party name", () => {
    beforeAll(() => {
        vi.unmock("./watchParty.utils");
    });

    afterAll(() => {
        vi.resetModules();
    });

    it("returns the party's name when provided", () => {
        const party = {
            name: "Friday Movie Night",
            showtime: {
                movie: {
                    title: "Example Movie",
                },
            },
        };
        expect(getPartyName(party)).toBe("Friday Movie Night");
    });

    it("trims surrounding whitespace from the party name", () => {
        const party = {
            name: "  Friday Movie Night  ",
            showtime: {
                movie: {
                    title: "Example Movie",
                },
            },
        };

        expect(getPartyName(party)).toBe("Friday Movie Night");
    });
});

describe("generateUniqueCode", () => {
    beforeAll(() => {
        vi.unmock("./watchParty");
    });

    afterAll(() => {
        vi.resetModules();
    });

    it("generates a unique code that is 7 characters long and uppercase", async () => {
        const mockDb: any = {
            watchParty: {
                findUnique: vi.fn().mockResolvedValue(null), 
            },
        };

        const code = await generateUniqueCode(mockDb);

        expect(code).toMatch(/^[A-Z0-9]{7}$/);

        expect(mockDb.watchParty.findUnique).toHaveBeenCalledWith({
            where: { inviteCode: code },
        });
    });

    it("throws after 5 failed attempts (kills <= 5 mutant)", async () => {
        const mockdb: any = {
            watchParty: {
                findUnique: vi.fn().mockResolvedValue({ id: "exists" }),
            },
        };

        await expect(generateUniqueCode(mockdb)).rejects.toMatchObject({
            code: "INTERNAL_SERVER_ERROR",
            message: expect.stringContaining(
                "Failed to generate a unique invite code"
            ),
        });

        expect(mockdb.watchParty.findUnique).toHaveBeenCalledTimes(5);
    });
});

describe("mapWatchPartyDetail", () => {
    it("maps watch party detail correctly for the host viewer", () => {
        const party = {
            id: "party-1",
            name: "Friday Movie Night",
            inviteCode: "ABC1234",
            status: "OPEN",
            createdAt: new Date("2026-01-10T10:00:00Z"),
            hostUserId: "user-1",
            showtimeId: "showtime-1",
            hostUser: {
                id: "user-1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
            },
            showtime: {
                id: "showtime-1",
                startTime: new Date("2026-01-15T19:00:00Z"),
                movie: {
                    title: "Example Movie",
                    posterUrl: "https://example.com/poster.jpg",
                },
            },
            participants: [
                {
                    id: "user-2",
                    firstName: "Tom",
                    lastName: "Cruise",
                    email: "tom@example.com",
                },
                {
                    id: "user-3",
                    firstName: "Henry",
                    lastName: "Cavill",
                    email: "henry@example.com",
                },
            ],
            _count: {
                participants: 2,
            },
        } as any;

        const result = mapWatchPartyDetail(party, "user-1");

        expect(result.memberCount).toBe(3);
        expect(result.viewerRole).toBe("LEADER");
        expect(result.participants).toEqual([
            expect.objectContaining({
                id: "user-2",
                name: "Tom Cruise",
                email: "tom@example.com",
                role: "PARTICIPANT",
            }),
            expect.objectContaining({
                id: "user-3",
                name: "Henry Cavill",
                email: "henry@example.com",
                role: "PARTICIPANT",
            }),
        ]);
    });
});
