"use client";

import type { Session } from "@supabase/supabase-js";

async function readErrorMessage(response: Response) {
    try {
        const payload = (await response.json()) as { error?: string };

        return payload.error || "Unable to synchronize your session.";
    } catch {
        return "Unable to synchronize your session.";
    }
}

export async function syncServerSession(session: Session) {
    if (!session.access_token || !session.refresh_token) {
        throw new Error("The authenticated session is incomplete.");
    }

    const response = await fetch("/auth/session", {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
        }),
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response));
    }
}

export async function clearServerSession() {
    const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "same-origin",
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response));
    }
}
