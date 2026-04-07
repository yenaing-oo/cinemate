import type { PrismaClient } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

function readMetadataString(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function toTitleCase(value: string) {
    if (!value) {
        return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function deriveFallbackNames(email: string) {
    const localPart = email.split("@")[0] ?? "";
    const parts = localPart
        .split(/[._-]+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map(toTitleCase);

    if (parts.length >= 2) {
        return {
            firstName: parts[0] ?? "Movie",
            lastName: parts.slice(1).join(" "),
        };
    }

    if (parts.length === 1) {
        return {
            firstName: parts[0] ?? "Movie",
            lastName: "Fan",
        };
    }

    return {
        firstName: "Movie",
        lastName: "Fan",
    };
}

function getProfileNames(supabaseUser: SupabaseUser, email: string) {
    const fallbackNames = deriveFallbackNames(email);
    const firstName =
        readMetadataString(supabaseUser.user_metadata?.first_name) ||
        readMetadataString(supabaseUser.user_metadata?.given_name) ||
        fallbackNames.firstName;
    const lastName =
        readMetadataString(supabaseUser.user_metadata?.last_name) ||
        readMetadataString(supabaseUser.user_metadata?.family_name) ||
        fallbackNames.lastName;

    return {
        firstName,
        lastName,
    };
}

export async function syncSupabaseUserToAppUser({
    db,
    supabaseUser,
}: {
    db: PrismaClient;
    supabaseUser: SupabaseUser;
}) {
    const email = supabaseUser.email?.trim().toLowerCase();

    if (!email) {
        return null;
    }

    const { firstName, lastName } = getProfileNames(supabaseUser, email);

    const existingBySupabaseId = await db.user.findUnique({
        where: { supabaseId: supabaseUser.id },
    });

    if (existingBySupabaseId) {
        if (
            existingBySupabaseId.email === email &&
            existingBySupabaseId.firstName === firstName &&
            existingBySupabaseId.lastName === lastName
        ) {
            return existingBySupabaseId;
        }

        return db.user.update({
            where: { id: existingBySupabaseId.id },
            data: {
                email,
                firstName,
                lastName,
            },
        });
    }

    const existingByEmail = await db.user.findUnique({
        where: { email },
    });

    if (existingByEmail) {
        return db.user.update({
            where: { id: existingByEmail.id },
            data: {
                supabaseId: supabaseUser.id,
                firstName,
                lastName,
            },
        });
    }

    return db.user.create({
        data: {
            supabaseId: supabaseUser.id,
            firstName,
            lastName,
            email,
        },
    });
}
