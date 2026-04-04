describe("emailRouter (missing RESEND_EMAIL_API_KEY)", () => {
    let emailRouter: any;
    const OLD_ENV = process.env;
    beforeEach(async () => {
        vi.resetModules();
        process.env = { ...OLD_ENV };
        delete process.env.RESEND_EMAIL_API_KEY;
        vi.doMock("resend", () => ({
            Resend: function () {
                throw new Error(
                    "Should not instantiate Resend when API key is missing"
                );
            },
        }));
        emailRouter = (await import("~/server/api/routers/email")).emailRouter;
    });
    afterEach(() => {
        process.env = OLD_ENV;
        vi.resetModules();
    });
    it("returns error when RESEND_EMAIL_API_KEY is missing", async () => {
        (db.user.findUnique as any).mockResolvedValue({
            id: "u1",
            email: "user@example.com",
        });
        const result = await emailRouter
            .createCaller({
                db: db,
                user: { id: "test-user", email: "user@example.com" },
            } as any)
            .sendConfirmation({
                userId: "test-user",
                movieTitle: "Dune",
                moviePosterUrl: "https://example.com/dune.jpg",
                showDate: "2026-07-01",
                showTime: "19:00",
                seatLabelList: ["A1", "A2"],
                totalPrice: "20.00",
                bookingId: "#12345",
            });
        expect(result).toEqual({
            ok: false,
            error: "RESEND_EMAIL_API_KEY is missing or empty",
        });
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("~/server/db", () => {
    return {
        db: {
            user: {
                findUnique: vi.fn(),
            },
        },
    };
});

import { db } from "~/server/db";

describe("emailRouter (resend error)", () => {
    let emailRouter: any;
    beforeEach(async () => {
        vi.doMock("resend", () => ({
            Resend: function () {
                return {
                    emails: {
                        send: vi.fn().mockResolvedValue({
                            error: { message: "Send failed" },
                        }),
                    },
                };
            },
        }));
        emailRouter = (await import("~/server/api/routers/email")).emailRouter;
    }, 30000);
    afterEach(() => {
        vi.resetModules();
    });
    it("returns error when resend.emails.send returns an error", async () => {
        (db.user.findUnique as any).mockResolvedValue({
            id: "u1",
            email: "user@example.com",
        });
        const result = await emailRouter
            .createCaller({
                db: db,
                user: { id: "test-user", email: "user@example.com" },
            } as any)
            .sendConfirmation({
                userId: "test-user",
                movieTitle: "Dune",
                moviePosterUrl: "https://example.com/dune.jpg",
                showDate: "2026-07-01",
                showTime: "19:00",
                seatLabelList: ["A1", "A2"],
                totalPrice: "20.00",
                bookingId: "#12345",
            });
        expect(result).toMatchObject({ error: { message: "Send failed" } });
    });
});

describe("emailRouter (resend success)", () => {
    let emailRouter: any;
    beforeEach(async () => {
        vi.doMock("resend", () => ({
            Resend: function () {
                return {
                    emails: {
                        send: vi.fn().mockResolvedValue({
                            data: { id: "some-id" },
                            error: undefined,
                        }),
                    },
                };
            },
        }));
        emailRouter = (await import("~/server/api/routers/email")).emailRouter;
    }, 30000);
    afterEach(() => {
        vi.resetModules();
    });
    it("sends confirmation email and calls db.user.findUnique with correct where clause", async () => {
        (db.user.findUnique as any).mockResolvedValue({
            id: "u1",
            email: "user@example.com",
        });
        const result = await emailRouter
            .createCaller({
                db: db,
                user: { id: "test-user", email: "user@example.com" },
            } as any)
            .sendConfirmation({
                userId: "test-user",
                movieTitle: "Dune",
                moviePosterUrl: "https://example.com/dune.jpg",
                showDate: "2026-07-01",
                showTime: "19:00",
                seatLabelList: ["A1", "A2"],
                totalPrice: "20.00",
                bookingId: "#12345",
            });
        expect(result).toEqual({
            ok: true,
            result: expect.objectContaining({
                id: expect.any(String),
            }),
        });
        expect(db.user.findUnique).toHaveBeenCalledWith({
            where: { id: "test-user" },
        });
    });
});

describe("emailRouter (user has no email)", () => {
    let emailRouter: any;
    beforeEach(async () => {
        vi.doMock("resend", () => ({
            Resend: function () {
                return {
                    emails: {
                        send: vi.fn(),
                    },
                };
            },
        }));
        emailRouter = (await import("~/server/api/routers/email")).emailRouter;
    }, 30000);
    afterEach(() => {
        vi.resetModules();
    });
    it("returns error when user has no email", async () => {
        (db.user.findUnique as any).mockResolvedValue({
            id: "u1",
            email: null,
        });
        const result = await emailRouter
            .createCaller({
                db: db,
                user: { id: "test-user", email: "user@example.com" },
            } as any)
            .sendConfirmation({
                userId: "test-user",
                movieTitle: "Dune",
                moviePosterUrl: "https://example.com/dune.jpg",
                showDate: "2026-07-01",
                showTime: "19:00",
                seatLabelList: ["A1", "A2"],
                totalPrice: "20.00",
                bookingId: "#12345",
            });
        expect(result).toBeUndefined();
    });
});
