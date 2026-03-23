import { WatchPartyStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/services/email", () => ({
    sendWatchPartyInvitations: vi.fn(),
}));

import { watchPartyRouter } from "./watchParty";

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

    it("allows a user to join when the watch party is active", async () => {
        mockCtx.db.watchParty.findUnique.mockResolvedValue({
            id: "party-1",
            hostUserId: "user-1",
            showtimeId: "showtime-1",
            status: WatchPartyStatus.ACTIVE,
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

    it.each([WatchPartyStatus.IN_PROGRESS, WatchPartyStatus.CONFIRMED])(
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
                message: "This watch party is not active and cannot be joined.",
            });

            expect(mockCtx.db.watchParty.update).not.toHaveBeenCalled();
        }
    );

    it("does not block an existing participant from reusing the invite code", async () => {
        mockCtx.db.watchParty.findUnique.mockResolvedValue({
            id: "party-1",
            hostUserId: "user-1",
            showtimeId: "showtime-1",
            status: WatchPartyStatus.CONFIRMED,
            participants: [{ id: "user-2" }],
        });

        const caller = watchPartyRouter.createCaller(mockCtx);
        const result = await caller.join({ inviteCode: "abc1234" });

        expect(result).toEqual({
            id: "party-1",
            joined: false,
        });
        expect(mockCtx.db.watchParty.update).not.toHaveBeenCalled();
    });
});
