// Shared layout shell for auth pages.
import { BackButton } from "~/components/ui/back-button";

export function AuthPageShell({
    backHref,
    backLabel,
    children,
}: {
    backHref: string;
    backLabel: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm space-y-4">
                <BackButton href={backHref}>{backLabel}</BackButton>
                {children}
            </div>
        </div>
    );
}
