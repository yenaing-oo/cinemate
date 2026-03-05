"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { formatTime } from "~/lib/utils";
import { $Enums } from "@prisma/client";

import TicketSelectionPage from "./childRoutes/ticketSelection/ticketSelectionpage";
import SeatSelectionPage from "./childRoutes/seatSelection/seatSelectionpage";
import CheckoutReviewPage from "./childRoutes/checkout/checkoutReviewPage";

export default function TicketingPage() {
    const router = useRouter();
    const utils = api.useUtils();
    const { data: session, isLoading } = api.bookingSession.get.useQuery(
        undefined,
        {
            staleTime: 0,
        }
    );

    const updateBookingSession = api.bookingSession.update.useMutation({
        onSuccess: async () => {
            await utils.bookingSession.get.invalidate();
        },
    });

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

    const handleUpdateSession = async (
        sessionId: string,
        goToStep: $Enums.BookingStep,
        ticketCount?: number,
        selectedShowtimeSeatIds?: string[]
    ) => {
        await updateBookingSession.mutateAsync({
            sessionId,
            goToStep,
            ticketCount,
            selectedSeatIds: selectedShowtimeSeatIds,
        });
    };

    return (
        <section>
            {isLoading ? (
                <p className="text-lg text-gray-600">Loading session…</p>
            ) : session ? (
                <>
                    <div className="sticky top-20 z-5 float-right">
                        <span className="font-semibold">Time left:</span>{" "}
                        <span className="font-mono font-semibold text-red-500">
                            {timeLeft !== null ? formatTime(timeLeft) : "00:00"}
                        </span>
                    </div>
                    {session.step === $Enums.BookingStep.TICKET_QUANTITY && (
                        <TicketSelectionPage
                            bookingSession={session}
                            handleUpdateSession={handleUpdateSession}
                        />
                    )}
                    {session.step === $Enums.BookingStep.SEAT_SELECTION && (
                        <SeatSelectionPage
                            bookingSession={session}
                            handleUpdateSession={handleUpdateSession}
                        />
                    )}
                    {session.step === $Enums.BookingStep.CHECKOUT && (
                        <CheckoutReviewPage
                            bookingSession={session}
                            handleUpdateSession={handleUpdateSession}
                            isSubmitting={updateBookingSession.isPending}
                        />
                    )}
                </>
            ) : (
                <p className="text-lg text-gray-600">
                    Select a movie and showtime to start your booking.
                </p>
            )}
        </section>
    );
}
