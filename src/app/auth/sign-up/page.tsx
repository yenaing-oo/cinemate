import { SignUpForm } from "~/components/sign-up-form";
import { AuthPageShell } from "../_components/auth-page-shell";

export default function Page() {
    return (
        <AuthPageShell backHref="/auth/login" backLabel="Back to login">
            <div className="w-full">
                <SignUpForm />
            </div>
        </AuthPageShell>
    );
}
