"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "~/lib/supabase/client";
import {
    clearServerSession,
    syncServerSession,
} from "~/lib/supabase/browser-session-sync";

async function syncServerAuthState({
    session,
    user,
}: {
    session: Session | null;
    user: User | null;
}) {
    if (user && session) {
        await syncServerSession(session);
        return;
    }

    if (!user) {
        await clearServerSession().catch(() => undefined);
    }
}

export function useAuthSession() {
    const [user, setUser] = useState<User | null | undefined>(undefined);

    useEffect(() => {
        const supabase = createClient();
        let isMounted = true;

        const syncSession = async () => {
            const [{ data: userData }, { data: sessionData }] =
                await Promise.all([
                    supabase.auth.getUser(),
                    supabase.auth.getSession(),
                ]);

            await syncServerAuthState({
                session: sessionData.session,
                user: userData.user ?? null,
            });

            if (isMounted) {
                setUser(userData.user ?? null);
            }
        };

        void syncSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                // Keep the UI in sync when the auth state changes.
                void syncServerAuthState({
                    session,
                    user: session?.user ?? null,
                });

                if (isMounted) {
                    setUser(session?.user ?? null);
                }
            }
        );

        return () => {
            isMounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    return {
        user,
        isAuthenticated: user ? true : user === null ? false : null,
        isLoading: user === undefined,
    };
}
