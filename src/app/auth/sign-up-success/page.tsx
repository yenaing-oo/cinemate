import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { AuthPageShell } from "../_components/auth-page-shell";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const isLocalSupabase =
    supabaseUrl.includes("127.0.0.1:54321") ||
    supabaseUrl.includes("localhost:54321");

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
                            {isLocalSupabase ? (
                                <p className="text-muted-foreground mt-3 text-sm">
                                    Local Supabase captures auth emails in
                                    Mailpit at{" "}
                                    <a
                                        href="http://localhost:54324"
                                        className="underline underline-offset-4"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        http://localhost:54324
                                    </a>
                                    .
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthPageShell>
    );
}
