"use client";

import { $Enums } from "@prisma/client";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Separator } from "~/components/ui/separator";
import { formatTime } from "~/lib/utils";
import { api } from "~/trpc/react";

import CheckoutReviewPage from "./childRoutes/checkout/checkoutReviewPage";
import SeatSelectionPage from "./childRoutes/seatSelection/seatSelectionpage";
import TicketSelectionPage from "./childRoutes/ticketSelection/ticketSelectionpage";

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

        // Once completion succeeds, bookingSession.get returns null and this flag
        // steers the fallback redirect to bookings instead of home.
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
            // Reset redirect intent if completion fails so users stay in flow.
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
        <section className="relative">
            {isLoading ? (
                <p className="text-lg text-gray-600">Loading session…</p>
            ) : session ? (
                <>
                    <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
                        <div className="mx-auto flex w-full max-w-7xl justify-end px-6 pt-22">
                            <div className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-white/20 bg-slate-950/75 px-5 py-2.5 shadow-lg backdrop-blur-sm">
                                <span className="text-sm font-semibold text-slate-200">
                                    Time left:
                                </span>
                                <span className="font-mono text-base font-semibold text-red-400">
                                    {timeLeft !== null
                                        ? formatTime(timeLeft)
                                        : "00:00"}
                                </span>
                            </div>
                        </div>
                    </div>
                    {session.watchPartyId ? (
                        <Alert className="glass-card mt-0 mb-4 border-cyan-300/20 bg-cyan-300/8 text-slate-100">
                            <Users className="text-cyan-100" />
                            <AlertTitle className="text-sm font-semibold text-white">
                                Watch party booking in progress
                            </AlertTitle>
                            <AlertDescription className="space-y-0 text-xs text-slate-200">
                                <p>
                                    You are booking tickets on behalf of your
                                    watch party. You will only need to pay for
                                    one ticket.
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
