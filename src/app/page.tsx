import Image from "next/image";
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

const nowPlaying = [
  {
    title: "Spider-Man: No Way Home",
    genre: "Action · Adventure",
    duration: "2h 28m",
    poster: "/posters/spiderman.jpg",
  },
  {
    title: "Jumanji",
    genre: "Adventure · Comedy",
    duration: "1h 59m",
    poster: "/posters/jumanji.jpg",
  },
  {
    title: "2012",
    genre: "Action · Sci-Fi",
    duration: "2h 38m",
    poster: "/posters/2012.jpg",
  },
  {
    title: "Passengers",
    genre: "Sci-Fi · Romance",
    duration: "1h 56m",
    poster: "/posters/passengers.jpg",
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
              "radial-gradient(circle at 10% 0%, rgba(72,214,255,0.2), rgba(7,13,24,0) 42%), radial-gradient(circle at 88% 18%, rgba(255,181,92,0.16), rgba(7,13,24,0) 38%), #070d18",
          }}
        >
          {/* HERO */}
          <section className="position-relative overflow-hidden" style={{ minHeight: "82vh" }}>
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
                  "linear-gradient(180deg, rgba(6,11,22,0.35), rgba(6,11,22,0.95))",
              }}
            />

            {/* HEADER */}
            <header className="position-fixed top-0 start-0 w-100 z-3">
              <div className="container py-3">
                <div
                  className="rounded-4 px-3 py-2"
                  style={{
                    background: "rgba(10,20,36,0.75)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="row align-items-center">
                    <div className="col-6 col-md-3 d-flex align-items-center gap-2">
                      <Image src="/favicon.png" alt="logo" width={36} height={36} />
                      <h1 className="m-0 fw-semibold fs-5">Cinemate</h1>
                    </div>

                    <nav className="col-md-6 d-none d-md-flex justify-content-center gap-4">
                      <Link href="/movies" className="text-white text-decoration-none">
                        Movies
                      </Link>
                      <Link href="#watch-party" className="text-white text-decoration-none">
                        WatchParty
                      </Link>
                      <Link href="#" className="text-white text-decoration-none">
                        Order History
                      </Link>
                    </nav>

                    <div className="col-6 col-md-3 d-flex justify-content-end">
                      <Link
                        href={session ? "/api/auth/signout" : "/api/auth/signin"}
                        className="btn rounded-pill px-4 fw-semibold"
                        style={{
                          background: "linear-gradient(90deg,#20c9ff,#4e7dff)",
                          color: "#fff",
                          border: "none",
                        }}
                      >
                        {session ? "Sign out" : "Sign in"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* HERO CONTENT */}
            <div className="container position-relative z-2">
              <div
                className="row justify-content-center text-center"
                style={{ minHeight: "70vh", paddingTop: "8rem" }}
              >
                <div className="col-lg-8">
                  <h2 className="fw-bold display-4">
                    Watch Together. Pay Apart.
                  </h2>
                  <p className="lead mt-3">
                    Organize group movie nights with individual payments.
                  </p>
                </div>
              </div>

              {/* TONIGHT SHOWTIMES */}
              <div className="row g-3 pb-5">
                {todayShowtimes.map((show) => (
                  <div key={show.title} className="col-12 col-md-6 col-xl-3">
                    <div
                      className="h-100 rounded-4 p-4"
                      style={{
                        border: "1px solid rgba(132,206,255,0.25)",
                        background:
                          "linear-gradient(180deg, rgba(12,28,50,0.78), rgba(12,28,50,0.55))",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <p className="mb-2 fw-semibold text-info">Tonight</p>
                      <h3 className="h6 fw-semibold mb-2">{show.title}</h3>
                      <p className="mb-0 text-white/80">{show.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* NOW PLAYING */}
          <section className="mx-auto max-w-7xl px-6 py-20">
            <div className="mb-10 flex items-center justify-between">
              <h3 className="text-3xl font-bold">Now Playing</h3>
              <Link href="/movies" className="text-sm text-blue-400 hover:text-blue-300">
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
              {nowPlaying.map((movie) => (
                <Link
                  key={movie.title}
                  href={`/movies/${encodeURIComponent(movie.title)}`}
                  className="rounded-xl bg-white/5 p-4 hover:bg-white/10 transition block"
                >
                  <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-lg">
                    <Image
                      src={movie.poster}
                      alt={movie.title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>

                  <h4 className="font-semibold truncate">{movie.title}</h4>
                  <p className="text-sm text-white/70">{movie.genre}</p>
                  <p className="text-xs text-white/50">{movie.duration}</p>
                </Link>
              ))}
            </div>
          </section>

          <footer className="border-t border-white/10 py-10 text-center text-sm text-white/60">
            © {new Date().getFullYear()} Cinemate
          </footer>
        </main>
      </>
    </HydrateClient>
  );
}
