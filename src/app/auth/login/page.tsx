import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "~/components/login-form";
import { createClient } from "~/lib/supabase/server";
import { AuthPageShell } from "../_components/auth-page-shell";

interface LoginPageProps {
    searchParams: Promise<{
        next?: string;
    }>;
}

export default async function Page({ searchParams }: LoginPageProps) {
    const params = await searchParams;
    const next =
        typeof params.next === "string" && params.next.startsWith("/")
            ? params.next
            : "/";
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        redirect(next);
    }

    return (
        <AuthPageShell backHref="/" backLabel="Back to home">
            <div className="w-full">
                <Suspense>
                    <LoginForm />
                </Suspense>
            </div>
        </AuthPageShell>
    );
}
