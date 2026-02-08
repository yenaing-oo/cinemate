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
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-red-600">Cinemate</h1>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/movies">Movies</Link>
              <Link href="#">WatchParty</Link>
              <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                className="rounded-full border border-red-600 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-600 hover:text-white transition"
              >
                {session ? "Sign out" : "Sign in"}
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="relative h-[70vh] overflow-hidden">
          <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover">
            <source src="/video/homepage.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/70" />

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
            <h2 className="text-5xl md:text-6xl font-extrabold">
              Movies,<span className="text-red-600"> Reimagined</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              Premium theatres. Immersive sound. Watch together.
            </p>
            <Link
              href="/movies"
              className="mt-8 rounded-md bg-red-600 px-8 py-3 text-lg font-semibold hover:bg-red-700"
            >
              Browse Movies
            </Link>
          </div>
        </section>

        {/* Preview Section */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 flex items-end justify-between">
            <h3 className="text-4xl font-bold">Now Playing</h3>
            <Link href="/movies" className="text-sm text-red-500 hover:text-red-400">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {["Movie One", "Movie Two", "Movie Three", "Movie Four"].map((movie) => (
              <div key={movie} className="rounded-xl bg-white/5 p-4 hover:bg-white/10">
                <div className="mb-3 h-56 rounded-md bg-white/10" />
                <h4 className="font-semibold">{movie}</h4>
                <p className="text-sm text-white/70">Action · 2h 15m</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 py-10 text-center text-sm text-white/60">
          © {new Date().getFullYear()} Cinemate
        </footer>
      </main>
    </HydrateClient>
  );
}
