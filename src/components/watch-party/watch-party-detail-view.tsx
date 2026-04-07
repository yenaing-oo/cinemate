"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, Users } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "~/components/ui/back-button";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { formatCad, formatShowtimeDate, formatShowtimeTime } from "~/lib/utils";
import {
    formatWatchPartyTimeLeft,
    getWatchPartyBookingDeadline,
    getWatchPartyTimeLeftMs,
    isWatchPartyBookable,
} from "~/lib/watch-party/timing";
import { useAuthSession } from "~/lib/hooks/use-auth-session";
import { api } from "~/trpc/react";
import {
    getWatchPartyStatusBadgeClassName,
    getWatchPartyStatusLabel,
} from "~/components/watch-party/watch-party-status";

export function WatchPartyDetailView({ partyId }: { partyId: string }) {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthSession();
    const [bookingError, setBookingError] = useState<string | null>(null);
    const watchPartyQuery = api.watchParty.getById.useQuery(
        { partyId },
        {
            enabled: isAuthenticated === true,
        }
    );
    const createWatchPartyBookingSession =
        api.bookingSession.createForWatchParty.useMutation({
            onSuccess: () => {
                toast.success("Watch party booking session started.");
                router.push("/ticketing");
            },
            onError: (error) => {
                setBookingError(
                    error.message ||
                        "Unable to start watch party booking right now."
                );
            },
        });
    const [timeLeftMs, setTimeLeftMs] = useState(0);

    useEffect(() => {
        if (
            !watchPartyQuery.data ||
            watchPartyQuery.data.viewerRole !== "LEADER"
        ) {
            return;
        }

        const updateTimeLeft = () => {
            setTimeLeftMs(
                getWatchPartyTimeLeftMs(watchPartyQuery.data.showtime.startTime)
            );
        };

        updateTimeLeft();
        const intervalId = window.setInterval(updateTimeLeft, 1000);

        return () => window.clearInterval(intervalId);
    }, [watchPartyQuery.data]);

    if (isAuthLoading) {
        return (
            <section className="py-10 md:py-14">
                <Card className="glass-card rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                    <CardContent className="flex items-center gap-3 p-6 text-sm text-slate-200">
                        <Spinner />
                        Loading watch party...
                    </CardContent>
                </Card>
            </section>
        );
    }

    if (isAuthenticated === false) {
        return (
            <section className="py-10 md:py-14">
                <Card className="glass-card rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                    <CardContent className="space-y-4 p-6">
                        <h1 className="text-2xl font-semibold text-white">
                            Sign in to view this watch party
                        </h1>
                        <p className="text-muted-foreground max-w-2xl leading-7">
                            Watch party membership is tied to your account so
                            your leader can keep the group booking accurate.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button asChild>
                                <Link
                                    href={`/auth/login?next=${encodeURIComponent(`/watch-party/${partyId}`)}`}
                                    prefetch={false}
                                >
                                    Go to login
                                </Link>
                            </Button>
                            <BackButton href="/watch-party">
                                Back to parties
                            </BackButton>
                        </div>
                    </CardContent>
                </Card>
            </section>
        );
    }

    if (watchPartyQuery.isLoading || !watchPartyQuery.data) {
        if (!watchPartyQuery.error) {
            return (
                <section className="py-10 md:py-14">
                    <Card className="glass-card rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                        <CardContent className="flex items-center gap-3 p-6 text-sm text-slate-200">
                            <Spinner />
                            Loading watch party...
                        </CardContent>
                    </Card>
                </section>
            );
        }
    }

    if (watchPartyQuery.error || !watchPartyQuery.data) {
        return (
            <section className="py-10 md:py-14">
                <Card className="glass-card rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                    <CardContent className="space-y-4 p-6">
                        <h1 className="text-2xl font-semibold text-white">
                            Watch party unavailable
                        </h1>
                        <p className="text-muted-foreground max-w-2xl leading-7">
                            {watchPartyQuery.error?.message ??
                                "We could not load this watch party."}
                        </p>
                        <BackButton href="/watch-party">
                            Back to parties
                        </BackButton>
                    </CardContent>
                </Card>
            </section>
        );
    }

    const party = watchPartyQuery.data;
    const participantCount = party.participants.length;
    const viewerSummary =
        party.viewerRole === "PARTICIPANT"
            ? "You joined this watch party. The party leader can now include you when booking tickets for this showtime."
            : "Everyone who joins with your invite code appears here so you can coordinate one booking for the group.";
    const bookingDeadline = getWatchPartyBookingDeadline(
        party.showtime.startTime
    );
    const canBookWatchParty = isWatchPartyBookable(party.showtime.startTime);

    const handleBookTickets = async () => {
        if (party.viewerRole !== "LEADER") {
            return;
        }

        setBookingError(null);

        await createWatchPartyBookingSession
            .mutateAsync({
                watchPartyId: party.id,
            })
            .catch(() => {
                // User-facing error state is handled in onError.
            });
    };

    return (
        <section className="space-y-8 py-10 md:py-14">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-semibold tracking-[0.2em] text-cyan-100 uppercase">
                        Watch Party
                    </p>
                    <h1 className="text-4xl font-bold text-white">
                        {party.name}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {party.showtime.movie.title} on{" "}
                        {formatShowtimeDate(party.showtime.startTime)} at{" "}
                        {formatShowtimeTime(party.showtime.startTime)}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <span
                        className={getWatchPartyStatusBadgeClassName(
                            party.status
                        )}
                    >
                        {getWatchPartyStatusLabel(party.status)}
                    </span>
                    <BackButton href="/watch-party">Back to parties</BackButton>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <Card className="glass-card rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                    <CardContent className="space-y-6 p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                                <p className="text-muted-foreground text-sm">
                                    Invite code
                                </p>
                                <p className="mt-2 text-xl font-semibold tracking-[0.24em] text-white">
                                    {party.inviteCode}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                                <p className="text-muted-foreground text-sm">
                                    Ticket price
                                </p>
                                <p className="mt-2 text-xl font-semibold text-white">
                                    {formatCad(party.showtime.price)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                            <p className="text-sm font-semibold text-white">
                                Party leader
                            </p>
                            <p className="mt-1 font-medium text-slate-100">
                                {party.leader.name ?? party.leader.email}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                {party.leader.email}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                            <p className="text-sm font-semibold text-white">
                                {party.viewerRole === "PARTICIPANT"
                                    ? "Membership confirmed"
                                    : "Leader view"}
                            </p>
                            <p className="text-muted-foreground mt-1 leading-7">
                                {viewerSummary}
                            </p>
                        </div>

                        {party.viewerRole === "LEADER" &&
                        party.status !== "CONFIRMED" ? (
                            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            Watch party booking window
                                        </p>
                                        <p className="text-muted-foreground mt-1 text-sm leading-6">
                                            This watch party stays valid until{" "}
                                            {formatShowtimeDate(
                                                bookingDeadline
                                            )}{" "}
                                            at{" "}
                                            {formatShowtimeTime(
                                                bookingDeadline
                                            )}
                                            . Booking closes 1 hour before the
                                            selected showtime.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white">
                                        {canBookWatchParty
                                            ? "Valid"
                                            : "Expired"}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                                            Time left
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold text-white">
                                            {formatWatchPartyTimeLeft(
                                                timeLeftMs
                                            )}
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        disabled={
                                            !canBookWatchParty ||
                                            createWatchPartyBookingSession.isPending
                                        }
                                        onClick={handleBookTickets}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            {createWatchPartyBookingSession.isPending ? (
                                                <Spinner />
                                            ) : null}
                                            <span>Book Tickets</span>
                                        </span>
                                    </Button>
                                </div>

                                {bookingError ? (
                                    <p className="mt-3 text-sm text-red-300">
                                        {bookingError}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card className="glass-card rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                    <CardContent className="space-y-5 p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-semibold text-white">
                                    Party members
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {party.memberCount} total member
                                    {party.memberCount === 1 ? "" : "s"}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                                    <Users className="h-4 w-4 text-cyan-100" />
                                    <span>
                                        {participantCount} participant
                                        {participantCount === 1 ? "" : "s"}{" "}
                                        joined
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                                    <Ticket className="h-4 w-4 text-cyan-100" />
                                    <span>
                                        {formatCad(party.showtime.price)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                                <p className="font-semibold text-white">
                                    {party.leader.name ?? party.leader.email}
                                </p>
                                <p className="text-sm text-cyan-100">
                                    Party leader
                                </p>
                            </div>

                            {party.participants.length > 0 ? (
                                party.participants.map((participant) => (
                                    <div
                                        key={participant.id}
                                        className="rounded-2xl border border-white/10 bg-white/4 p-4"
                                    >
                                        <p className="font-semibold text-white">
                                            {participant.name ??
                                                participant.email}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            Participant
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-4">
                                    <p className="font-semibold text-white">
                                        No participants have joined yet
                                    </p>
                                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                                        Share the invite code with your group.
                                        Joined participants appear here so the
                                        leader can book for them.
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
