import Link from "next/link";
import "~/styles/globals.css";
import { TRPCReactProvider } from "~/trpc/react";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="text-foreground">
                <TRPCReactProvider>
                    {/* GLOBAL HEADER */}
                    <header className="fixed inset-x-0 top-0 z-30">
                        <div className="mx-auto w-full max-w-7xl px-6 py-3">
                            <div className="glass-panel rounded-2xl px-4 py-2">
                                <div className="grid grid-cols-2 items-center gap-4 md:grid-cols-3">
                                    {/* LEFT: LOGO */}
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href="/"
                                            className="flex items-center gap-2 text-foreground no-underline"
                                        >
                                            <img
                                                src="/favicon.png"
                                                alt="Cinemate logo"
                                                width={36}
                                                height={36}
                                                className="rounded-md"
                                            />
                                            <h1 className="text-base font-semibold">
                                                Cinemate
                                            </h1>
                                        </Link>
                                    </div>

                                    {/* CENTER: NAV */}
                                    <nav className="hidden items-center justify-center gap-6 text-sm font-medium text-muted-foreground md:flex">
                                        <Link
                                            href="/movies"
                                            className="transition hover:text-foreground"
                                        >
                                            Movies
                                        </Link>
                                        <Link
                                            href="#watch-party"
                                            className="transition hover:text-foreground"
                                        >
                                            WatchParty
                                        </Link>
                                        <Link
                                            href="#"
                                            className="transition hover:text-foreground"
                                        >
                                            Order History
                                        </Link>
                                    </nav>

                                    {/* RIGHT: SIGN IN */}
                                    <div className="flex justify-end">
                                        <Link
                                            href="/api/auth/signin"
                                            className="btn-primary"
                                        >
                                            Sign in
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* PAGE CONTENT */}
                    <main className="mx-auto w-full max-w-7xl px-6 pt-24 pb-12">
                        {children}
                    </main>

                    {/* GLOBAL FOOTER */}
                    <footer className="mx-auto w-full max-w-7xl px-6 py-6 text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Cinemate
                    </footer>
                </TRPCReactProvider>
            </body>
        </html>
    );
}
