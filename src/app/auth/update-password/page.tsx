import { UpdatePasswordForm } from "~/components/update-password-form";
import { AuthPageShell } from "../_components/auth-page-shell";

export default function Page() {
    return (
        <AuthPageShell backHref="/auth/login" backLabel="Back to login">
            <div className="w-full">
                <UpdatePasswordForm />
            </div>
        </AuthPageShell>
    );
}
