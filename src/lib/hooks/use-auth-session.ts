"use client";

import { useEffect, useState } from "react";
import { createClient } from "~/lib/supabase/client";

export function useAuthSession() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
        null
    );

    useEffect(() => {
        const supabase = createClient();
        let isMounted = true;

        const syncSession = async () => {
            const { data } = await supabase.auth.getSession();

            if (isMounted) {
                setIsAuthenticated(Boolean(data.session));
            }
        };

        void syncSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(() => {
            void syncSession();
        });

        return () => {
            isMounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    return {
        isAuthenticated,
        isLoading: isAuthenticated === null,
    };
}
