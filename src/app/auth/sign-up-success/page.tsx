import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { AuthPageShell } from "../_components/auth-page-shell";

export default function Page() {
    return (
        <AuthPageShell backHref="/auth/login" backLabel="Back to login">
            <div className="w-full">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                Thank you for signing up!
                            </CardTitle>
                            <CardDescription>
                                Check your email to confirm
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                You&apos;ve successfully signed up. Please check
                                your email to confirm your account before
                                signing in.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthPageShell>
    );
}
