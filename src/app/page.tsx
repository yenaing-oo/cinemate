import Link from "next/link";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
    const session = await auth();

    void api.example.hello.prefetch({ text: "from tRPC" });

    return (
        <HydrateClient>
            <main className="min-h-screen bg-[#0b0b0b] text-white">
                {/* Header */}
                <header className="w-full border-b border-white/10 relative z-20">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <h1 className="text-2xl font-bold text-red-600">
                            Cinemate
                        </h1>
                        <nav className="flex items-center gap-6 text-sm">
                            <Link href="#">Movies</Link>
                            <Link href="#">WatchParty</Link>
                            <Link
                                href={
                                    session
                                        ? "/api/auth/signout"
                                        : "/api/auth/signin"
                                }
                                className="rounded-md bg-red-600 px-4 py-2 font-semibold hover:bg-red-700"
                            >
                                {session ? "Sign out" : "Sign in"}
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* Main Section with Video */}
                <section className="relative h-[70vh] w-full overflow-hidden">
                    {/* Background Video */}
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover"
                    >
                        <source src="/video/homepage.mp4" type="video/mp4" />
                    </video>

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/70"></div>

                    {/* Main Content */}
                    <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
                        <h2 className="text-5xl font-extrabold">
                            Experience Movies Like Never Before
                        </h2>
                        <p className="mt-4 max-w-2xl text-lg text-white/80">
                            Watch the latest blockbusters in premium theatres
                            with immersive sound and picture quality.
                        </p>
                        <Link
                            href="#now-playing"
                            className="mt-6 rounded-md bg-red-600 px-8 py-3 text-lg font-semibold hover:bg-red-700"
                        >
                            View Showtimes
                        </Link>
                    </div>
                </section>

                {/* Now Playing Section */}
                <section
                    id="now-playing"
                    className="mx-auto max-w-7xl px-6 py-16"
                >
                    <h3 className="mb-8 text-3xl font-bold">Now Playing</h3>
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                        {[
                            "Movie One",
                            "Movie Two",
                            "Movie Three",
                            "Movie Four",
                        ].map((movie) => (
                            <div
                                key={movie}
                                className="rounded-lg bg-white/5 p-4 hover:bg-white/10"
                            >
                                <div className="mb-3 h-56 w-full rounded-md bg-white/10" />
                                <h4 className="text-lg font-semibold">
                                    {movie}
                                </h4>
                                <p className="text-sm text-white/70">
                                    Action · 2h 15m
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/10 py-6 text-center text-sm text-white/60">
                    © {new Date().getFullYear()} Cinemate. All rights reserved.
                </footer>
            </main>
        </HydrateClient>
    );
}
