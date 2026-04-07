"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "~/lib/supabase/client";
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
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const logout = async () => {
        if (isSigningOut) {
            return;
        }

        setIsSigningOut(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
            setIsSigningOut(false);
            return;
        }

        onLoggedOut?.();

        // Refresh after sign out so server pages drop user data right away.
        router.replace(redirectTo);
        router.refresh();
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
