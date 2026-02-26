"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { formatShowtimeTime, formatTime } from "~/lib/utils";

export default function TicketingPage() {
    const router = useRouter();
    const { data: session, isLoading } = api.bookingSession.get.useQuery(
        undefined,
        {
            staleTime: 0,
        }
    );
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoading && !session) {
            router.replace("/");
        }
    }, [isLoading, session, router]);

    useEffect(() => {
        if (!session?.expiresAt) return;
        const expiresAt = session.expiresAt.getTime();
        function update() {
            setTimeLeft(expiresAt - Date.now());
        }
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [session?.expiresAt]);

    return (
        <section className="mx-auto max-w-7xl px-6 py-20">
            <h1 className="mb-10 text-4xl font-bold">Book Your Tickets</h1>
            {isLoading ? (
                <p className="text-lg text-gray-600">Loading session…</p>
            ) : session ? (
                <div className="mb-6">
                    <span className="font-semibold">Time left:</span>{" "}
                    <span className="font-mono text-red-600">
                        {timeLeft !== null ? formatTime(timeLeft) : "00:00"}
                    </span>
                    <p className="text-sm text-gray-500">
                        Movie: {session.showtime.movie.title}
                    </p>
                    <p className="text-sm text-gray-500">
                        Showtime: {formatShowtimeTime(session.showtime.startTime)}
                    </p>
                </div>
            ) : (
                <p className="text-lg text-gray-600">
                    Select a movie and showtime to start your booking.
                </p>
            )}
        </section>
    );
}
