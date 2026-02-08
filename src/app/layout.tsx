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
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        />
      </head>

      <body
        className="text-white"
        style={{
          background:
            "radial-gradient(circle at 10% 0%, rgba(72,214,255,0.2), rgba(7,13,24,0) 42%), radial-gradient(circle at 88% 18%, rgba(255,181,92,0.16), rgba(7,13,24,0) 38%), #070d18",
        }}
      >
        <TRPCReactProvider>
          {/* GLOBAL HEADER */}
          <header className="position-fixed top-0 start-0 w-100 z-3">
            <div className="container py-3">
              <div
                className="rounded-4 px-4 py-2 d-flex justify-content-between align-items-center"
                style={{
                  background: "rgba(10,20,36,0.75)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Link href="/" className="fw-bold fs-5 text-white text-decoration-none">
                  Cinemate
                </Link>

                <nav className="d-flex gap-4">
                  <Link href="/movies" className="text-white text-decoration-none">
                    Movies
                  </Link>
                  <Link href="#" className="text-white text-decoration-none">
                    WatchParty
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main style={{ paddingTop: "96px" }}>{children}</main>

          {/* GLOBAL FOOTER */}
          <footer className="py-4 text-center text-white/60">
            © {new Date().getFullYear()} Cinemate
          </footer>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
