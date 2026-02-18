import Image from "next/image";
import { api, HydrateClient } from "~/trpc/server";
import { Card, CardContent } from "~/components/ui/card";

export default async function OrderHistoryPage() {
    const res = await api.bookings.myHistory();
    const bookings = res.items;

    const now = new Date();

    const currentBookings = bookings.filter((b) => new Date(b.showtime) >= now);

    const pastBookings = bookings.filter((b) => new Date(b.showtime) < now);

    function BookingCard({ booking }: { booking: any }) {
        return (
            <Card className="lift-card border-border/60 bg-card/60 hover:bg-card/80 rounded-xl border transition">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        {/* Poster */}
                        <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                            <Image
                                src={
                                    booking.posterUrl ??
                                    "/posters/placeholder.png"
                                }
                                alt={booking.movieTitle}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                            <h4 className="truncate text-lg font-semibold">
                                {booking.movieTitle}
                            </h4>

                            {/* Showtime badge */}
                            <span className="bg-muted text-muted-foreground mt-1 inline-block rounded-full px-3 py-1 text-xs">
                                {new Date(booking.showtime).toLocaleString()}
                            </span>

                            <p className="text-muted-foreground mt-3 text-sm">
                                <span className="text-foreground/90 font-medium">
                                    Seats:
                                </span>{" "}
                                {booking.seats.join(", ")}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <HydrateClient>
            <section className="mx-auto w-full max-w-7xl space-y-14 px-6 pt-6 pb-16">
                {/* CURRENT BOOKINGS */}
                <div>
                    <h3 className="mb-6 text-2xl font-bold">
                        Current Bookings
                    </h3>

                    {currentBookings.length === 0 ? (
                        <p className="text-muted-foreground">
                            You don’t have any upcoming bookings.
                        </p>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {currentBookings.map((b) => (
                                <BookingCard key={b.id} booking={b} />
                            ))}
                        </div>
                    )}
                </div>

                {/* PAST BOOKINGS */}
                <div>
                    <h3 className="mb-6 text-2xl font-bold">Past Bookings</h3>

                    {pastBookings.length === 0 ? (
                        <p className="text-muted-foreground">
                            No past bookings yet.
                        </p>
                    ) : (
                        <div className="grid gap-6 opacity-90 sm:grid-cols-2 lg:grid-cols-3">
                            {pastBookings.map((b) => (
                                <BookingCard key={b.id} booking={b} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </HydrateClient>
    );
}
