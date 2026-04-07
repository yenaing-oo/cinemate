// Shows auth-related errors returned through the auth flow.
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AuthPageShell } from "../_components/auth-page-shell";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ error: string }>;
}) {
    const params = await searchParams;

    return (
        <AuthPageShell backHref="/auth/login" backLabel="Back to login">
            <div className="w-full">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                Sorry, something went wrong.
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {params?.error ? (
                                <p className="text-muted-foreground text-sm">
                                    Code error: {params.error}
                                </p>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    An unspecified error occurred.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthPageShell>
    );
}
