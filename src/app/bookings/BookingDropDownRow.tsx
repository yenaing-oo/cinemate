import Image from "next/image";
import { Card, CardContent } from "~/components/ui/card";
import {
    formatShowtimeTime,
    formatShowtimeDate,
    formatBookingNumber,
    formatCad,
} from "~/lib/utils";
import { formatSeatFromCode } from "~/lib/utils";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { toast } from "sonner";
import { BookingStatus } from "@prisma/client";
import { Spinner } from "~/components/ui/spinner";

interface BookingDropdownRowProps {
    booking: Booking;
    onCancel?: () => Promise<void>;
}

interface Booking {
    id: string;
    bookingNumber: number;
    status: BookingStatus;
    showtime: {
        startTime: Date;
        movie: { posterUrl?: string | null; title: string };
    };
    tickets: { showtimeSeat: { seat: { row: number; number: number } } }[];
    totalAmount: number;
}

function isBookingCancellable(booking: Booking): boolean {
    const now = new Date();
    const showtimeDate = new Date(booking.showtime.startTime);
    const timeDiff = showtimeDate.getTime() - now.getTime();
    return (
        booking.status === BookingStatus.CONFIRMED && timeDiff > 60 * 60 * 1000
    );
}

export function BookingDropDownRow(props: BookingDropdownRowProps) {
    console.log("BookingDropDownRow rendered with booking:", props.booking);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const formattedTime = formatShowtimeTime(props.booking.showtime.startTime);
    const formattedDate = formatShowtimeDate(props.booking.showtime.startTime);
    const formattedBookingNumber = formatBookingNumber(
        props.booking.bookingNumber
    );
    const formattedAmount = formatCad(props.booking.totalAmount);
    const seats = props.booking.tickets.map((t) => t.showtimeSeat.seat);
    const formattedSeats =
        seats.map((s) => formatSeatFromCode(s.row, s.number)).join(", ") || "-";

    const canCancel = isBookingCancellable(props.booking);

    const handleCancel = async () => {
        setLoading(true);
        try {
            if (props.onCancel) await props.onCancel();
            toast.success("Booking cancelled successfully.");
        } catch {
            toast.error("Failed to cancel booking.");
        } finally {
            setLoading(false);
            setDialogOpen(false);
        }
    };

    return (
        <Card className="border-border/60 bg-card/60 rounded-xl border p-1">
            <CardContent className="p-2">
                <details className="group">
                    <summary className="hover:bg-card/80 cursor-pointer list-none rounded-xl px-4 py-4 transition select-none">
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
                                <Image
                                    src={
                                        props.booking.showtime.movie
                                            .posterUrl ??
                                        "/posters/placeholder.png"
                                    }
                                    alt={props.booking.showtime.movie.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                    {props.booking.showtime.movie.title}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    {formattedDate} @ {formattedTime}
                                </p>
                            </div>
                            <div className="text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                                ▾
                            </div>
                        </div>
                    </summary>
                    <div className="px-4 pb-4">
                        <div className="border-border/60 bg-card/40 mt-2 space-y-2 rounded-lg border p-5 text-sm">
                            <div className="mb-4 flex items-center border-b pb-2">
                                <span className="text-md font-semibold">
                                    Booking {formattedBookingNumber}
                                </span>
                                <div className="ml-auto">
                                    {props.booking.status ===
                                    BookingStatus.CANCELLED ? (
                                        <span className="text-destructive font-semibold">
                                            Cancelled
                                        </span>
                                    ) : canCancel ? (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            disabled={loading}
                                            onClick={() => setDialogOpen(true)}
                                        >
                                            Cancel Booking
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                            <div className="mb-2 flex justify-between">
                                <span className="text-muted-foreground">
                                    Seats
                                </span>
                                <span className="font-medium">
                                    {formattedSeats}
                                </span>
                            </div>
                            <div className="mb-2 flex justify-between">
                                <span className="text-muted-foreground">
                                    Total
                                </span>
                                <span className="font-medium">
                                    {formattedAmount}
                                </span>
                            </div>
                        </div>
                    </div>
                </details>
                <ConfirmDialog
                    open={dialogOpen}
                    title="Cancel Booking"
                    description="Are you sure you want to cancel this booking? This action cannot be undone."
                    confirmText={
                        <span className="flex items-center gap-2">
                            Yes, Cancel
                            {loading && <Spinner className="ml-1" />}
                        </span>
                    }
                    cancelText="Back"
                    onConfirm={handleCancel}
                    onCancel={() => setDialogOpen(false)}
                />
            </CardContent>
        </Card>
    );
}
