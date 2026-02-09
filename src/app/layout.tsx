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
                className="rounded-4 px-3 py-2"
                style={{
                  border: "1px solid rgba(122, 206, 255, 0.32)",
                  background:
                    "linear-gradient(180deg, rgba(10, 20, 36, 0.82), rgba(10, 20, 36, 0.42))",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="row align-items-center">
                  {/* LEFT: LOGO */}
                  <div className="col-6 col-md-3 d-flex align-items-center gap-2">
                    <Link
                      href="/"
                      className="d-flex align-items-center gap-2 text-white text-decoration-none"
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src="/favicon.png"
                        alt="Cinemate logo"
                        width={36}
                        height={36}
                        className="rounded-2"
                      />
                      <h1 className="m-0 fw-semibold fs-5">Cinemate</h1>
                    </Link>
                  </div>

                  {/* CENTER: NAV */}
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

                  {/* RIGHT: SIGN IN */}
                  <div className="col-6 col-md-3 d-flex justify-content-end">
                    <Link
                      href="/api/auth/signin"
                      className="btn rounded-pill px-4 fw-semibold"
                      style={{
                        background: "linear-gradient(90deg,#20c9ff,#4e7dff)",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main>{children}</main>

          {/* GLOBAL FOOTER */}
          <footer className="py-4 text-center text-white/60">
            © {new Date().getFullYear()} Cinemate
          </footer>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
