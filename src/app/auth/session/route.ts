import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "~/lib/supabase/server";
import { syncSupabaseUserToAppUser } from "~/server/auth/sync-app-user";
import { db } from "~/server/db";

const sessionPayloadSchema = z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
});

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsedBody = sessionPayloadSchema.safeParse(body);

    if (!parsedBody.success) {
        return NextResponse.json(
            { error: "A valid authenticated session is required." },
            { status: 400 }
        );
    }

    const supabase = await createClient();
    const { error, data } = await supabase.auth.setSession({
        access_token: parsedBody.data.accessToken,
        refresh_token: parsedBody.data.refreshToken,
    });

    if (error || !data.user) {
        return NextResponse.json(
            { error: error?.message || "Unable to restore your session." },
            { status: 401 }
        );
    }

    await syncSupabaseUserToAppUser({
        db,
        supabaseUser: data.user,
    });

    return new NextResponse(null, { status: 204 });
}
