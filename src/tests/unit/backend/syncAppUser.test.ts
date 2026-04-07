import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";

import { syncSupabaseUserToAppUser } from "~/server/auth/sync-app-user";

function createDb() {
    return {
        user: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
            update: vi.fn(),
        },
    } as unknown as PrismaClient;
}

describe("syncSupabaseUserToAppUser", () => {
    it("returns null when the Supabase user has no email", async () => {
        const db = createDb();

        const result = await syncSupabaseUserToAppUser({
            db,
            supabaseUser: {
                id: "sb-user-1",
                email: null,
                user_metadata: {},
            } as any,
        });

        expect(result).toBeNull();
        expect(db.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns the existing app user when it is already in sync", async () => {
        const db = createDb();
        const existingUser = {
            id: "app-user-1",
            supabaseId: "sb-user-1",
            email: "jane.doe@example.com",
            firstName: "Jane",
            lastName: "Doe",
        };

        db.user.findUnique = vi.fn().mockResolvedValueOnce(existingUser);

        const result = await syncSupabaseUserToAppUser({
            db,
            supabaseUser: {
                id: "sb-user-1",
                email: "Jane.Doe@example.com",
                user_metadata: {
                    first_name: " Jane ",
                    last_name: "Doe ",
                },
            } as any,
        });

        expect(result).toEqual(existingUser);
        expect(db.user.update).not.toHaveBeenCalled();
        expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it("upserts a user by normalized email when no Supabase link exists yet", async () => {
        const db = createDb();
        const upsertedUser = {
            id: "app-user-1",
            supabaseId: "sb-user-1",
            email: "jane.doe@example.com",
            firstName: "Jane",
            lastName: "Doe",
        };

        db.user.findUnique = vi.fn().mockResolvedValueOnce(null);
        db.user.upsert = vi.fn().mockResolvedValueOnce(upsertedUser);

        const result = await syncSupabaseUserToAppUser({
            db,
            supabaseUser: {
                id: "sb-user-1",
                email: "Jane.Doe@example.com",
                user_metadata: {
                    first_name: " Jane ",
                    last_name: "Doe ",
                },
            } as any,
        });

        expect(result).toEqual(upsertedUser);
        expect(db.user.upsert).toHaveBeenCalledWith({
            where: { email: "jane.doe@example.com" },
            update: {
                supabaseId: "sb-user-1",
                email: "jane.doe@example.com",
                firstName: "Jane",
                lastName: "Doe",
            },
            create: {
                supabaseId: "sb-user-1",
                email: "jane.doe@example.com",
                firstName: "Jane",
                lastName: "Doe",
            },
        });
    });

    it("recovers when a concurrent insert causes a unique constraint error", async () => {
        const db = createDb();
        const recoveredUser = {
            id: "app-user-1",
            supabaseId: null,
            email: "jane.doe@example.com",
            firstName: "Jane",
            lastName: "Doe",
        };
        const updatedUser = {
            ...recoveredUser,
            supabaseId: "sb-user-1",
        };

        db.user.findUnique = vi
            .fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(recoveredUser);
        db.user.upsert = vi.fn().mockRejectedValueOnce({ code: "P2002" });
        db.user.update = vi.fn().mockResolvedValueOnce(updatedUser);

        const result = await syncSupabaseUserToAppUser({
            db,
            supabaseUser: {
                id: "sb-user-1",
                email: "jane.doe@example.com",
                user_metadata: {
                    first_name: "Jane",
                    last_name: "Doe",
                },
            } as any,
        });

        expect(result).toEqual(updatedUser);
        expect(db.user.update).toHaveBeenCalledWith({
            where: { id: "app-user-1" },
            data: {
                supabaseId: "sb-user-1",
                email: "jane.doe@example.com",
                firstName: "Jane",
                lastName: "Doe",
            },
        });
    });

    it("throws a clear error when the email belongs to a different Supabase user", async () => {
        const db = createDb();
        const conflictingUser = {
            id: "app-user-1",
            supabaseId: "sb-user-2",
            email: "jane.doe@example.com",
            firstName: "Jane",
            lastName: "Doe",
        };

        db.user.findUnique = vi
            .fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(conflictingUser);
        db.user.upsert = vi.fn().mockRejectedValueOnce({ code: "P2002" });

        await expect(
            syncSupabaseUserToAppUser({
                db,
                supabaseUser: {
                    id: "sb-user-1",
                    email: "jane.doe@example.com",
                    user_metadata: {
                        first_name: "Jane",
                        last_name: "Doe",
                    },
                } as any,
            })
        ).rejects.toThrow(
            "Unable to sync the authenticated user due to a conflicting user record."
        );
    });
});
