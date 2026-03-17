"use client";

import { useRouter } from "next/navigation";
import { $Enums } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { toast } from "sonner";
import {
    formatCad,
    formatSeatFromCode,
    formatShowtimeDate,
    formatShowtimeTime,
    formatBookingNumber,
} from "~/lib/utils";
import { BookingReviewPanel } from "~/components/checkout/bookingReviewPanel";
import { useSendConfirmationEmail } from "~/lib/emailServices";
import { api } from "~/trpc/react";

interface CheckoutReviewPageProps {
    bookingSession: {
        showtime: {
            movie: {
                title: string;
                id: string;
                posterUrl: string | null;
                backdropUrl: string | null;
                languages: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            movieId: string;
            startTime: Date;
            endTime: Date;
            price: Decimal;
        };
        selectedSeats: ({
            seat: {
                number: number;
                id: string;
                row: number;
            };
        } & {
            id: string;
            showtimeId: string;
            updatedAt: Date;
            seatId: string;
            isBooked: boolean;
            heldByUserId: string | null;
            heldTill: Date | null;
            bookingSessionId: string | null;
        })[];
    } & {
        id: string;
        userId: string | null;
        showtimeId: string;
        ticketCount: number | null;
        step: $Enums.BookingStep;
        startedAt: Date;
        expiresAt: Date;
        lastUpdatedAt: Date;
    };
    handleUpdateSession: (
        sessionId: string,
        goToStep: $Enums.BookingStep,
        ticketCount?: number,
        selectedShowtimeSeatIds?: string[]
    ) => Promise<void>;
    isSubmitting: boolean;
}

export default function CheckoutReviewPage({
    bookingSession,
    handleUpdateSession,
    isSubmitting,
}: CheckoutReviewPageProps) {
    const router = useRouter();
    const latestBookingMutation =
        api.bookings.latestBookingDetails.useMutation();
    const sendConfirmationEmail = useSendConfirmationEmail();

    const movieTitle = bookingSession.showtime.movie.title;
    const moviePosterUrl = bookingSession.showtime.movie.posterUrl;
    const showtimeDate = bookingSession.showtime.startTime;
    const ticketPrice = Number(bookingSession.showtime.price);
    const seatCount = bookingSession.selectedSeats.length;

    const selectedSeatLabels = bookingSession.selectedSeats
        .map((selectedSeat) => {
            return {
                label: formatSeatFromCode(
                    selectedSeat.seat.row,
                    selectedSeat.seat.number
                ),
                row: selectedSeat.seat.row,
                number: selectedSeat.seat.number,
            };
        })
        .sort((a, b) => a.row - b.row || a.number - b.number)
        .map((seat) => seat.label);

    const priceEach = formatCad(ticketPrice);
    const total = formatCad(ticketPrice * seatCount);
    const showDate = formatShowtimeDate(showtimeDate);
    const showTime = formatShowtimeTime(showtimeDate);
    const showtimeLabel = `${showDate} | ${showTime}`;

    async function processConfirmationEmail() {
        const lastestBooking = await latestBookingMutation.mutateAsync();

        if (!lastestBooking) return;

        const formatedBookingNumber = formatBookingNumber(
            lastestBooking.bookingNumber
        );

        await sendConfirmationEmail({
            userId: bookingSession.userId,
            movieTitle: movieTitle,
            moviePosterUrl: moviePosterUrl,
            showDate: showDate,
            showTime: showTime,
            seatLabelList: selectedSeatLabels,
            totalPrice: total,
            bookingId: formatedBookingNumber,
        });
    }

    return (
        <BookingReviewPanel
            movieTitle={movieTitle}
            showtimeLabel={showtimeLabel}
            posterUrl={moviePosterUrl}
            seatLabels={selectedSeatLabels}
            ticketCount={seatCount}
            priceEach={priceEach}
            total={total}
            isSubmitting={isSubmitting}
            onConfirm={async (_paymentDetails) => {
                try {
                    await handleUpdateSession(
                        bookingSession.id,
                        $Enums.BookingStep.COMPLETED
                    );
                    await processConfirmationEmail();
                    router.push("/bookings");
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Unable to confirm your reservation.";
                    toast.error(message, {
                        description:
                            "Your session may have expired or seats changed. Please select your seats again.",
                    });
                    router.replace("/ticketing");
                    router.refresh();
                }
            }}
        />
    );
}
