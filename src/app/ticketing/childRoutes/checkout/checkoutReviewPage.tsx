"use client";

import { useRouter } from "next/navigation";
import { $Enums } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { toast } from "sonner";
import { BackButton } from "~/components/ui/back-button";
import {
    formatCad,
    formatSeatFromCode,
    formatShowtimeDate,
    formatShowtimeTime,
} from "~/lib/utils";
import { BookingReviewPanel } from "~/components/checkout/bookingReviewPanel";
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
        watchPartyId?: string | null;
        payableTicketCount?: number;
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
    const savePaymentMethod = api.paymentMethod.save.useMutation();

    const movieTitle = bookingSession.showtime.movie.title;
    const moviePosterUrl = bookingSession.showtime.movie.posterUrl;
    const showtimeDate = bookingSession.showtime.startTime;
    const ticketPrice = Number(bookingSession.showtime.price);
    const seatCount = bookingSession.selectedSeats.length;
    const payableTicketCount =
        bookingSession.payableTicketCount ??
        (bookingSession.watchPartyId ? 1 : seatCount);

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
    const total = formatCad(ticketPrice * payableTicketCount);
    const showDate = formatShowtimeDate(showtimeDate);
    const showTime = formatShowtimeTime(showtimeDate);
    const showtimeLabel = `${showDate} | ${showTime}`;
    const isConfirming = isSubmitting || savePaymentMethod.isPending;

    return (
        <BookingReviewPanel
            backButton={
                <BackButton
                    disabled={isSubmitting}
                    onClick={() => {
                        void handleUpdateSession(
                            bookingSession.id,
                            $Enums.BookingStep.SEAT_SELECTION
                        ).catch((error) => {
                            const message =
                                error instanceof Error
                                    ? error.message
                                    : "Unable to go back to seat selection.";
                            toast.error(message);
                            router.replace("/ticketing");
                            router.refresh();
                        });
                    }}
                >
                    Back to seats
                </BackButton>
            }
            movieTitle={movieTitle}
            showtimeLabel={showtimeLabel}
            posterUrl={moviePosterUrl}
            seatLabels={selectedSeatLabels}
            ticketCount={payableTicketCount}
            priceEach={priceEach}
            total={total}
            isSubmitting={isConfirming}
            onConfirm={async (paymentDetails) => {
                try {
                    if (paymentDetails.source === "new") {
                        await savePaymentMethod.mutateAsync({
                            cardNumber: paymentDetails.cardNumber,
                        });
                    }

                    await handleUpdateSession(
                        bookingSession.id,
                        $Enums.BookingStep.COMPLETED
                    );
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
                    return;
                }
            }}
        />
    );
}
