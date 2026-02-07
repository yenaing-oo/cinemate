import Link from "next/link";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import NowPlaying from "./nowPlaying";

const todayShowtimes = [
    {
        title: "2012",
        details: "6:15 PM • Dolby Atmos",
    },
    {
        title: "Jumanji: The Next Level",
        details: "7:40 PM • Dolby Atmos",
    },
    {
        title: "Spider Man: No Way Home",
        details: "9:05 PM • 3D + Dolby Atmos",
    },
    {
        title: "The Batman",
        details: "10:30 PM • 3D",
    },
];


export default async function Home() {
    const session = await auth();

    void api.example.hello.prefetch({ text: "from tRPC" });

    return (
        <HydrateClient>
            <>
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
                />
                <main
                    className="text-white"
                    style={{
                        background:
                            "radial-gradient(circle at 10% 0%, rgba(255, 154, 92, 0.2), rgba(7, 18, 36, 0) 40%), radial-gradient(circle at 90% 22%, rgba(53, 151, 255, 0.22), rgba(7, 18, 36, 0) 38%), #071224",
                    }}
                >
                    <section
                        className="position-relative overflow-hidden"
                        style={{ minHeight: "82vh" }}
                    >
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
                        >
                            <source src="/video/homepage.mp4" type="video/mp4" />
                        </video>

                        <div
                            className="position-absolute top-0 start-0 w-100 h-100"
                            style={{
                                background:
                                    "linear-gradient(180deg, rgba(6, 12, 23, 0.38) 0%, rgba(6, 12, 23, 0.84) 58%, rgba(6, 12, 23, 0.98) 100%), radial-gradient(circle at 18% 8%, rgba(255, 154, 92, 0.3), rgba(6, 12, 23, 0) 46%), radial-gradient(circle at 85% 12%, rgba(53, 151, 255, 0.3), rgba(6, 12, 23, 0) 40%)",
                            }}
                        />

                        <header className="position-fixed top-0 start-0 w-100 z-3">
                            <div className="container py-3">
                                <div
                                    className="rounded-4 px-3 py-2"
                                    style={{
                                        border:
                                            "1px solid rgba(255, 255, 255, 0.16)",
                                        background:
                                            "linear-gradient(180deg, rgba(9, 17, 30, 0.75), rgba(9, 17, 30, 0.38))",
                                        backdropFilter: "blur(10px)",
                                    }}
                                >
                                    <div className="row align-items-center g-2">
                                        <div className="col-6 col-md-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <img
                                                    src="/favicon.png"
                                                    alt="Cinemate logo"
                                                    width={36}
                                                    height={36}
                                                    className="rounded-2"
                                                />
                                                <h1
                                                    className="m-0 fw-semibold"
                                                    style={{
                                                        letterSpacing: "0.04em",
                                                        fontSize: "1.35rem",
                                                    }}
                                                >
                                                    Cinemate
                                                </h1>
                                            </div>
                                        </div>

                                        <nav className="col-md-6 d-none d-md-flex justify-content-center">
                                            <div
                                                className="d-inline-flex align-items-center gap-4 px-4 py-2 rounded-pill"
                                                style={{
                                                    background:
                                                        "rgba(255,255,255,0.08)",
                                                    border: "1px solid rgba(255,255,255,0.14)",
                                                }}
                                            >
                                                <Link
                                                    href="#now-playing"
                                                    className="text-decoration-none text-white fw-medium"
                                                >
                                                    Movies
                                                </Link>
                                                <Link
                                                    href="#watch-party"
                                                    className="text-decoration-none text-white fw-medium"
                                                >
                                                    WatchParty
                                                </Link>
                                                <Link
                                                    href="#"
                                                    className="text-decoration-none text-white fw-medium"
                                                >
                                                    Order History
                                                </Link>
                                            </div>
                                        </nav>

                                        <div className="col-6 col-md-3 d-flex justify-content-end">
                                            <Link
                                                href={
                                                    session
                                                        ? "/api/auth/signout"
                                                        : "/api/auth/signin"
                                                }
                                                className="btn rounded-pill px-4 fw-semibold"
                                                style={{
                                                    color: "#ffffff",
                                                    background:
                                                        "linear-gradient(90deg, #f05d42, #f18745)",
                                                    border: "none",
                                                }}
                                            >
                                                {session
                                                    ? "Sign out"
                                                    : "Sign in"}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <div className="container position-relative z-2">
                            <div
                                className="row justify-content-center text-center"
                                style={{ minHeight: "72vh", paddingTop: "8rem" }}
                            >
                                <div className="col-lg-8">
                                    <p
                                        className="text-uppercase fw-semibold mb-3"
                                        style={{
                                            letterSpacing: "0.12em",
                                            color: "rgba(255,255,255,0.78)",
                                            fontSize: "0.84rem",
                                        }}
                                    >
                                        Cinemate Premium Cinema
                                    </p>
                                    <h2
                                        className="fw-bold"
                                        style={{
                                            fontSize: "clamp(2.35rem, 5.2vw, 4.9rem)",
                                            lineHeight: 1.05,
                                            letterSpacing: "0.01em",
                                        }}
                                    >
                                        The big-screen experience, upgraded.
                                    </h2>
                                    <p
                                        className="lead mt-4 mx-auto"
                                        style={{
                                            maxWidth: "760px",
                                            color: "rgba(255,255,255,0.9)",
                                        }}
                                    >
                                        Discover new releases, reserve your
                                        favorite seats, and enjoy premium
                                        formats in a modern cinema built for
                                        movie nights.
                                    </p>
                                    <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
                                        <Link
                                            href="#now-playing"
                                            className="btn btn-lg rounded-pill px-5 py-3 fw-semibold"
                                            style={{
                                                color: "#ffffff",
                                                background:
                                                    "linear-gradient(90deg, #ec6d45, #f1a352)",
                                                border: "none",
                                            }}
                                        >
                                            Book Tickets
                                        </Link>
                                        <Link
                                            href="#watch-party"
                                            className="btn btn-outline-light btn-lg rounded-pill px-5 py-3 fw-semibold"
                                        >
                                            Explore WatchParty
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="row g-3 pb-4">
                                {todayShowtimes.map((show) => (
                                    <div key={show.title} className="col-12 col-md-6 col-xl-3">
                                        <div
                                            className="h-100 rounded-4 p-3 p-lg-4"
                                            style={{
                                                border:
                                                    "1px solid rgba(255,255,255,0.16)",
                                                background:
                                                    "linear-gradient(180deg, rgba(11, 24, 44, 0.64), rgba(11, 24, 44, 0.42))",
                                                backdropFilter: "blur(8px)",
                                            }}
                                        >
                                            <p
                                                className="mb-2 fw-semibold"
                                                style={{
                                                    color: "#8bcbff",
                                                    fontSize: "0.82rem",
                                                }}
                                            >
                                                Tonight
                                            </p>
                                            <h3 className="h6 fw-semibold mb-2">
                                                {show.title}
                                            </h3>
                                            <p
                                                className="mb-0"
                                                style={{
                                                    color: "rgba(255,255,255,0.83)",
                                                    fontSize: "0.95rem",
                                                }}
                                            >
                                                {show.details}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Now Playing Section */}
                    <section
                        id="now-playing"
                        className="mx-auto max-w-7xl px-6 py-16"
                    >
                        <NowPlaying/>
                    </section>

                    {/* Footer */}
                    <footer
                        className="py-4 text-center"
                        style={{
                            borderTop: "1px solid rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.7)",
                            background: "#071224",
                        }}
                    >
                        © {new Date().getFullYear()} Cinemate. All rights
                        reserved.
                    </footer>
                </main>
            </>
        </HydrateClient>
    );
}
