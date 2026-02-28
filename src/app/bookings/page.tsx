"use client";

import { api } from "~/trpc/react";
import { BookingDropDownRow } from "~/app/bookings/BookingDropDownRow";

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
                            return (
                                <BookingDropDownRow
                                    key={b.id}
                                    booking={b}
                                    onCancel={() => handleCancel(b.id)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
