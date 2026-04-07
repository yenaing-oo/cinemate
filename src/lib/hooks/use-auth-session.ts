"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "~/lib/supabase/client";

export function useAuthSession() {
    const [user, setUser] = useState<User | null | undefined>(undefined);

    useEffect(() => {
        const supabase = createClient();
        let isMounted = true;

        const syncSession = async () => {
            const { data } = await supabase.auth.getSession();

            if (isMounted) {
                setUser(data.session?.user ?? null);
            }
        };

        void syncSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                // Keep the UI in sync when the auth state changes.
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
