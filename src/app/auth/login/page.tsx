import { Suspense } from "react";
import { LoginForm } from "~/components/login-form";
import { AuthPageShell } from "../_components/auth-page-shell";

export default function Page() {
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
