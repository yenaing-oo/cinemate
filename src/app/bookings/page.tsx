"use client";

import { api } from "~/trpc/react";
import { BookingDropDownRow } from "~/app/bookings/BookingDropDownRow";
import { BookingStatus } from "@prisma/client";

interface Booking {
    id: string;
    status: BookingStatus;
    showtime: {
        startTime: Date;
        movie: { posterUrl?: string | null; title: string };
    };
    tickets: { showtimeSeat: { seat: { row: number; number: number } } }[];
}

function isBookingCancellable(booking: Booking): boolean {
    const now = new Date();
    const showtimeDate = new Date(booking.showtime.startTime);
    const timeDiff = showtimeDate.getTime() - now.getTime();
    return (
        booking.status === BookingStatus.CONFIRMED && timeDiff > 60 * 60 * 1000
    );
}

export default function OrderHistoryPage() {
    const bookingsQuery = api.bookings.list.useQuery();
    const cancelMutation = api.bookings.cancel.useMutation({
        onSuccess: () => {
            bookingsQuery.refetch();
        },
    });

    const bookings = bookingsQuery.data ?? [];

    const handleCancel = async (bookingId: string) => {
        await cancelMutation.mutateAsync({ bookingId });
    };

    return (
        <section className="mx-auto w-full max-w-7xl space-y-14 px-6 pt-6 pb-16">
            <div>
                <h3 className="mb-6 text-2xl font-bold">Your Bookings</h3>
                {bookings.length === 0 ? (
                    <p className="text-muted-foreground">
                        You&apos;ve not booked any tickets yet.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((b) => {
                            const seats = b.tickets.map(
                                (t) => t.showtimeSeat.seat
                            );
                            const canCancel = isBookingCancellable(b);
                            return (
                                <BookingDropDownRow
                                    key={b.id}
                                    posterUrl={
                                        b.showtime.movie.posterUrl ?? undefined
                                    }
                                    movieTitle={b.showtime.movie.title}
                                    showtime={new Date(b.showtime.startTime)}
                                    seats={seats}
                                    canCancel={canCancel}
                                    onCancel={() => handleCancel(b.id)}
                                    cancelled={
                                        b.status === BookingStatus.CANCELLED
                                    }
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
