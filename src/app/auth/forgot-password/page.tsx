// Forgot password page route.
import { ForgotPasswordForm } from "~/components/forgot-password-form";
import { AuthPageShell } from "../_components/auth-page-shell";

export default function Page() {
    return (
        <AuthPageShell backHref="/auth/login" backLabel="Back to login">
            <div className="w-full">
                <ForgotPasswordForm />
            </div>
        </AuthPageShell>
    );
}
