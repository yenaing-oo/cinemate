import Link from "next/link";
import NowPlaying from "../nowPlaying";

export default function MoviesPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-red-600">
            Cinemate
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/movies">Movies</Link>
            <Link href="#">WatchParty</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <NowPlaying />
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-sm text-white/60">
        © {new Date().getFullYear()} Cinemate
      </footer>
    </main>
  );
}
