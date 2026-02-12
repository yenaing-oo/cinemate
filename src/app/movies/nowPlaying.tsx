"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "~/components/ui/card";

const movies = [
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

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getNext7Days() {
    const today = startOfToday();

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }


export default function NowPlaying() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(
    null
  );

  const iconRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const week = useMemo(() => getNext7Days(), []);
  const today = useMemo(() => startOfToday(), []);

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => setPortalReady(true), []);

  const updatePopupPosition = () => {
    const btn = iconRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    setPopupPos({
      top: rect.bottom + 10 + window.scrollY,
      left: rect.right - 320 + window.scrollX,
    });
  };

  const openPopup = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    updatePopupPosition();
    setOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (
        open &&
        !iconRef.current?.contains(t) &&
        !popupRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handler = () => updatePopupPosition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open]);

  const selectedLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select a date";

  return (
    <div className="w-full">
      <h3 className="mb-6 text-4xl font-bold">Now Playing</h3>

      <div className="mb-16 flex flex-col gap-4 md:flex-row">
        <input
          type="text"
          placeholder="Search movies"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-border/60 bg-card/60 px-6 py-3 text-sm text-foreground ring-1 ring-border/50 backdrop-blur-xl outline-none placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary rounded-full"
        />

        {/* DATE FIELD */}
        <div
          onClick={() => {
            if (!open) router.push("/selectDates");
          }}
          className="flex-1 cursor-pointer border border-border/60 bg-card/60 px-6 py-3 text-sm text-muted-foreground ring-1 ring-border/50 backdrop-blur-xl rounded-full"
        >
          <div className="flex items-center justify-between">
            <span className="truncate">{selectedLabel}</span>

            <button
              ref={iconRef}
              type="button"
              aria-label="Open calendar"
              onMouseEnter={(e) => {
                e.stopPropagation();
                openPopup();
              }}
              onMouseLeave={scheduleClose}
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              className="ml-3 grid h-8 w-8 place-items-center rounded-md text-muted-foreground/80 hover:text-foreground transition"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="opacity-80"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {portalReady &&
        open &&
        popupPos &&
        createPortal(
          <div
            ref={popupRef}
            onMouseEnter={openPopup}
            onMouseLeave={scheduleClose}
            style={{
              position: "absolute",
              top: popupPos.top,
              left: popupPos.left,
              width: 320,
              zIndex: 99999,
            }}
            className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-3 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
              {["S", "M", "T", "W", "Th", "F", "Sa"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
              {week.map((d) => {
                const isPast = d.getTime() < today.getTime();

                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    disabled={isPast}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPast) return;
                      setSelectedDate(d);
                      setOpen(false);
                      router.push("/selectDates");
                    }}
                    className={[
                      "rounded-lg py-2 text-sm transition",
                      isPast
                        ? "cursor-not-allowed text-muted-foreground/35"
                        : "text-foreground/80 hover:bg-primary/15 hover:text-foreground",
                    ].join(" ")}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {filteredMovies.map((movie) => (
          <Link
            key={movie.title}
            href={`/movies/${encodeURIComponent(movie.title)}`}
            className="block"
          >
            <Card className="border-border/60 bg-card/60 hover:bg-card/80 border transition">
              <CardContent className="p-4">
                <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-lg">
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>

                <h4 className="truncate font-semibold">{movie.title}</h4>
                <p className="text-muted-foreground text-sm">{movie.genre}</p>
                <p className="text-muted-foreground/70 text-xs">
                  {movie.duration}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
