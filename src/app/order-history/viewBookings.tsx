import Image from "next/image";
import { api, HydrateClient } from "~/trpc/server";
import { Card, CardContent } from "~/components/ui/card";

function formatShowtime(d: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(d);
}

function BookingDropdownRow({ booking }: { booking: any }) {
    const poster = booking.posterUrl ?? "/posters/placeholder.png";
    const showtime = formatShowtime(new Date(booking.showtime));
    const seats = booking.seats.join(", ");

    return (
        <Card className="border-border/60 bg-card/60 rounded-xl border">
            <CardContent className="p-0">
                <details className="group">
                    {/* HEADER ROW */}
                    <summary className="hover:bg-card/80 cursor-pointer list-none rounded-xl px-4 py-4 transition select-none">
                        <div className="flex items-center gap-4">
                            {/* Poster */}
                            <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md">
                                <Image
                                    src={poster}
                                    alt={booking.movieTitle}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Title + time */}
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                    {booking.movieTitle}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    {showtime}
                                </p>
                            </div>

                            {/* Chevron */}
                            <div className="text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                                ▾
                            </div>
                        </div>
                    </summary>

                    {/* EXPANDED DETAILS */}
                    <div className="px-4 pb-4">
                        <div className="border-border/60 bg-card/40 mt-2 space-y-2 rounded-lg border p-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Movie
                                </span>
                                <span className="font-medium">
                                    {booking.movieTitle}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Showtime
                                </span>
                                <span className="font-medium">{showtime}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Seats
                                </span>
                                <span className="font-medium">{seats}</span>
                            </div>
                        </div>
                    </div>
                </details>
            </CardContent>
        </Card>
    );
}

export default async function OrderHistoryPage() {
    const res = await api.bookings.myHistory();
    const bookings = res?.items ?? [];


    const now = new Date();
    const currentBookings = bookings.filter((b) => new Date(b.showtime) >= now);

    return (
        <HydrateClient>
            <section className="mx-auto w-full max-w-7xl space-y-14 px-6 pt-6 pb-16">
                <div>
                    <h3 className="mb-6 text-2xl font-bold">Your Bookings</h3>

                    {currentBookings.length === 0 ? (
                        <p className="text-muted-foreground">
                            You don’t have any upcoming bookings.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {currentBookings
                                .sort(
                                    (a, b) =>
                                        new Date(a.showtime).getTime() -
                                        new Date(b.showtime).getTime()
                                )
                                .map((b) => (
                                    <BookingDropdownRow
                                        key={b.id}
                                        booking={b}
                                    />
                                ))}
                        </div>
                    )}
                </div>
            </section>
        </HydrateClient>
    );
}
