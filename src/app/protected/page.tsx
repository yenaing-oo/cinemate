// Simple protected page used to verify logged-in access.
import { redirect } from "next/navigation";

import { BackButton } from "~/components/ui/back-button";
import { LogoutButton } from "~/components/logout-button";
import { createClient } from "~/lib/supabase/server";

export default async function ProtectedPage() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
        redirect("/auth/login");
    }

    return (
        <div className="flex h-svh w-full items-center justify-center p-6">
            <div className="flex w-full max-w-md flex-col gap-6">
                <BackButton href="/">Back to home</BackButton>
                <div className="flex items-center justify-center gap-2">
                    <p>
                        Hello <span>{data.claims.email}</span>
                    </p>
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
}
