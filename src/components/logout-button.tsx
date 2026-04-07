"use client";

import { useState } from "react";

import { createClient } from "~/lib/supabase/client";
import { clearServerSession } from "~/lib/supabase/browser-session-sync";
import { Button } from "~/components/ui/button";

type LogoutButtonProps = Omit<
    React.ComponentProps<typeof Button>,
    "onClick"
> & {
    onLoggedOut?: () => void;
    redirectTo?: string;
};

export function LogoutButton({
    children,
    disabled,
    onLoggedOut,
    redirectTo = "/auth/login",
    ...buttonProps
}: LogoutButtonProps) {
    const [isSigningOut, setIsSigningOut] = useState(false);

    const logout = async () => {
        if (isSigningOut) {
            return;
        }

        setIsSigningOut(true);
        const supabase = createClient();
        await Promise.allSettled([
            clearServerSession(),
            supabase.auth.signOut().then(({ error }) => {
                if (error) {
                    throw error;
                }
            }),
        ]);

        onLoggedOut?.();

        // Force a full reload so protected pages and middleware immediately
        // see the signed-out cookie state.
        window.location.assign(redirectTo);
    };

    return (
        <Button
            {...buttonProps}
            disabled={disabled || isSigningOut}
            onClick={logout}
        >
            {children ?? "Sign out"}
        </Button>
    );
}
