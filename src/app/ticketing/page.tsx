"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { api } from "~/trpc/react";
import { formatTime } from "~/lib/utils";
import { $Enums } from "@prisma/client";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Separator } from "~/components/ui/separator";

import TicketSelectionPage from "./childRoutes/ticketSelection/ticketSelectionpage";
import SeatSelectionPage from "./childRoutes/seatSelection/seatSelectionpage";
import CheckoutReviewPage from "./childRoutes/checkout/checkoutReviewPage";

export default function TicketingPage() {
    const router = useRouter();
    const utils = api.useUtils();
    const [shouldRedirectToBookings, setShouldRedirectToBookings] =
        useState(false);
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
            router.replace(shouldRedirectToBookings ? "/bookings" : "/");
        }
    }, [isLoading, router, session, shouldRedirectToBookings]);

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
        const isCompletingBooking = goToStep === $Enums.BookingStep.COMPLETED;

        if (isCompletingBooking) {
            setShouldRedirectToBookings(true);
        }

        try {
            await updateBookingSession.mutateAsync({
                sessionId,
                goToStep,
                ticketCount,
                selectedSeatIds: selectedShowtimeSeatIds,
            });
        } catch (error) {
            if (isCompletingBooking) {
                setShouldRedirectToBookings(false);
            }

            throw error;
        }
    };

    const watchPartyHost = session?.watchParty?.hostUser;
    const watchPartyHostName = watchPartyHost
        ? `${watchPartyHost.firstName} ${watchPartyHost.lastName}`.trim() ||
          watchPartyHost.email
        : null;
    const watchPartyParticipantNames =
        session?.watchParty?.participants.map((participant) => {
            const fullName =
                `${participant.firstName} ${participant.lastName}`.trim();
            return fullName || participant.email;
        }) ?? [];

    return (
        <section>
            {isLoading ? (
                <p className="text-lg text-gray-600">Loading session…</p>
            ) : session ? (
                <>
                    <div className="sticky top-20 z-[9999] float-right mb-6">
                        <span className="font-semibold">Time left:</span>{" "}
                        <span className="font-mono font-semibold text-red-500">
                            {timeLeft !== null ? formatTime(timeLeft) : "00:00"}
                        </span>
                    </div>
                    {session.watchPartyId ? (
                        <Alert className="glass-card clear-both mt-0 mb-4 border-cyan-300/20 bg-cyan-300/8 text-slate-100">
                            <Users className="text-cyan-100" />
                            <AlertTitle className="text-sm font-semibold text-white">
                                Watch party booking in progress
                            </AlertTitle>
                            <AlertDescription className="space-y-0 text-xs text-slate-200">
                                <p>
                                    You are booking tickets on behalf of your
                                    watch party.
                                </p>
                                <Separator className="my-1 bg-white/15" />
                                {watchPartyHostName ? (
                                    <p>
                                        <span className="font-semibold text-slate-100">
                                            Host:
                                        </span>{" "}
                                        {watchPartyHostName}
                                    </p>
                                ) : null}
                                {watchPartyParticipantNames.length > 0 ? (
                                    <p>
                                        <span className="font-semibold text-slate-100">
                                            Participants:
                                        </span>{" "}
                                        {watchPartyParticipantNames.join(", ")}
                                    </p>
                                ) : null}
                            </AlertDescription>
                        </Alert>
                    ) : null}
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
