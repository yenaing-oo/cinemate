"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { formatShowtimeDate, formatShowtimeTime } from "~/lib/utils";
import { api } from "~/trpc/react";

interface ShowtimesPageProps {
    params: Promise<{ movieId: string }>;
}

interface Showtime {
    id: string;
    startTime: Date;
    price?: number;
}

type WatchPartyDialogStep = "decision" | "invite";

function groupShowtimesByDate(showtimes: Showtime[]): Map<string, Showtime[]> {
    return showtimes.reduce((map, showtime) => {
        const key = formatShowtimeDate(showtime.startTime);
        map.set(key, [...(map.get(key) ?? []), showtime]);
        return map;
    }, new Map<string, Showtime[]>());
}

function parseInviteEmails(value: string) {
    return Array.from(
        new Set(
            value
                .split(/[\n,]+/)
                .map((email) => email.trim())
                .filter(Boolean)
        )
    );
}

function MoviePoster({
    title,
    posterUrl,
}: {
    title: string;
    posterUrl?: string | null;
}) {
    return (
        <div className="space-y-4 lg:pt-10">
            <div className="relative aspect-2/3 overflow-hidden rounded-2xl border border-white/10">
                <Image
                    src={posterUrl ?? "/posters/placeholder.png"}
                    alt={`${title} poster`}
                    fill
                    className="object-cover"
                    sizes="320px"
                />
            </div>
            <h1 className="ml-1 text-xl font-bold">{title}</h1>
        </div>
    );
}

function DateList({
    availableDates,
    showtimesByDate,
    effectiveDate,
    onSelectDate,
}: {
    availableDates: string[];
    showtimesByDate: Map<string, Showtime[]>;
    effectiveDate: string | null;
    onSelectDate: (date: string) => void;
}) {
    return (
        <div className="min-w-0 space-y-3 lg:pt-3">
            <p className="text-foreground text-sm font-bold tracking-[0.2em] uppercase">
                Dates
            </p>
            <div className="grid gap-3">
                {availableDates.map((dateKey) => {
                    const dayShowtimes = showtimesByDate.get(dateKey) ?? [];

                    return (
                        <Button
                            key={dateKey}
                            variant={
                                dateKey === effectiveDate
                                    ? "default"
                                    : "outline"
                            }
                            className="h-auto w-full justify-start py-4 whitespace-normal"
                            onClick={() => onSelectDate(dateKey)}
                        >
                            <span className="block w-full min-w-0">
                                <span className="block text-left text-base font-semibold">
                                    {formatShowtimeDate(dateKey)}
                                </span>
                                <span className="text-muted-foreground mt-1 block text-left text-sm">
                                    {dayShowtimes.length} showings
                                </span>
                            </span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

function ShowtimePicker({
    showtimes,
    selectedShowtimeId,
    onSelect,
}: {
    showtimes: Showtime[];
    selectedShowtimeId: string | null;
    onSelect: (showtime: Showtime) => void;
}) {
    return (
        <div className="min-w-0 space-y-5 lg:pt-10">
            <h2 className="text-2xl font-semibold md:text-3xl">
                Choose a showtime
            </h2>

            {showtimes.length > 0 ? (
                <>
                    <div className="flex flex-wrap gap-3">
                        {showtimes.map((showtime) => (
                            <Button
                                key={showtime.id}
                                variant={
                                    showtime.id === selectedShowtimeId
                                        ? "default"
                                        : "outline"
                                }
                                size="lg"
                                className="min-w-28"
                                onClick={() => onSelect(showtime)}
                            >
                                {formatShowtimeTime(showtime.startTime)}
                            </Button>
                        ))}
                    </div>
                </>
            ) : (
                <p className="text-muted-foreground text-sm">
                    No upcoming showtimes are available yet.
                </p>
            )}
        </div>
    );
}

function WatchPartyDialog({
    open,
    movieTitle,
    showtime,
    step,
    inviteEmails,
    bookingPending,
    bookingError,
    onInviteEmailsChange,
    onCancel,
    onBack,
    onChooseRegularBooking,
    onChooseWatchParty,
    onSendEmails,
}: {
    open: boolean;
    movieTitle?: string;
    showtime: Showtime | null;
    step: WatchPartyDialogStep;
    inviteEmails: string;
    bookingPending: boolean;
    bookingError?: string;
    onInviteEmailsChange: (value: string) => void;
    onCancel: () => void;
    onBack: () => void;
    onChooseRegularBooking: () => void;
    onChooseWatchParty: () => void;
    onSendEmails: () => void;
}) {
    if (!open || !showtime) return null;

    const inviteCount = parseInviteEmails(inviteEmails).length;
    const showtimeLabel = `${formatShowtimeDate(showtime.startTime)} at ${formatShowtimeTime(showtime.startTime)}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="watch-party-dialog-title"
                className="glass-panel relative w-full max-w-xl overflow-hidden rounded-[30px] border border-[rgba(122,206,255,0.22)] bg-[linear-gradient(180deg,rgba(10,20,36,0.96),rgba(10,20,36,0.88))] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(32,201,255,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,181,92,0.12),transparent_30%)]" />
                <div className="relative space-y-6 p-6">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-full border border-white/10 bg-white/5"
                        onClick={onCancel}
                        disabled={bookingPending}
                        aria-label="Close dialog"
                    >
                        ×
                    </Button>

                    <div className="space-y-2 pr-12">
                        <p className="text-primary text-xs font-semibold tracking-[0.28em] uppercase">
                            {step === "decision"
                                ? "Watch Party"
                                : "Invite Guests"}
                        </p>
                        <h2
                            id="watch-party-dialog-title"
                            className="text-2xl font-semibold text-white"
                        >
                            {step === "decision"
                                ? "Book this showtime or create a watch party?"
                                : "Send invites for your watch party"}
                        </h2>
                        {step === "invite" ? (
                            <p className="text-muted-foreground text-sm leading-6">
                                Add the guest email addresses for this showtime.
                                Invitation code delivery is handled outside this
                                UI.
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2 rounded-[24px] border border-[rgba(122,206,255,0.18)] bg-[linear-gradient(135deg,rgba(32,201,255,0.12),rgba(78,125,255,0.08),rgba(255,181,92,0.08))] p-4">
                        <p className="text-primary/90 text-xs font-semibold tracking-[0.2em] uppercase">
                            Selected showtime
                        </p>
                        <p className="text-base font-semibold">
                            {movieTitle ?? "Selected movie"}
                        </p>
                        <p className="text-muted-foreground text-sm">
                            {showtimeLabel}
                        </p>
                    </div>

                    {step === "decision" ? (
                        <div className="space-y-4">
                            {bookingError ? (
                                <p className="text-destructive text-sm">
                                    {bookingError}
                                </p>
                            ) : null}

                            <div className="grid gap-3 pt-2 sm:grid-cols-2">
                                <Button
                                    variant="outline"
                                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                                    onClick={onChooseWatchParty}
                                    disabled={bookingPending}
                                >
                                    Create watch party
                                </Button>
                                <Button
                                    className="bg-[linear-gradient(90deg,#20c9ff,#4e7dff)] text-white shadow-[0_14px_32px_rgba(32,201,255,0.22)] hover:opacity-95"
                                    onClick={onChooseRegularBooking}
                                    disabled={bookingPending}
                                >
                                    {bookingPending
                                        ? "Starting booking..."
                                        : "Book without watch party"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="watch-party-emails">
                                    Invitee emails
                                </Label>
                                <textarea
                                    id="watch-party-emails"
                                    value={inviteEmails}
                                    onChange={(event) =>
                                        onInviteEmailsChange(event.target.value)
                                    }
                                    rows={6}
                                    placeholder="friend1@example.com, friend2@example.com"
                                    className="border-input bg-background/80 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-32 w-full rounded-2xl border border-white/12 px-4 py-3 text-sm outline-none focus-visible:ring-[3px]"
                                />
                            </div>

                            <p className="text-muted-foreground text-sm">
                                {inviteCount > 0
                                    ? `${inviteCount} invite email${inviteCount === 1 ? "" : "s"} ready to send.`
                                    : "Enter at least one email address to continue."}
                            </p>

                            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                                <Button
                                    variant="outline"
                                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                                    onClick={onBack}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                                    onClick={onCancel}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-[linear-gradient(90deg,#20c9ff,#4e7dff)] text-white shadow-[0_14px_32px_rgba(32,201,255,0.22)] hover:opacity-95"
                                    onClick={onSendEmails}
                                    disabled={inviteCount === 0}
                                >
                                    Send emails
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function MovieShowtimesPageContent({ movieId }: { movieId: string }) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedShowtimeId, setSelectedShowtimeId] = useState<string | null>(
        null
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogStep, setDialogStep] =
        useState<WatchPartyDialogStep>("decision");
    const [inviteEmails, setInviteEmails] = useState("");
    const [activeShowtime, setActiveShowtime] = useState<Showtime | null>(null);

    const { data: payload, isLoading } = api.showtimes.getByMovie.useQuery({
        movieId,
    });

    const router = useRouter();

    const createBookingSession = api.bookingSession.create.useMutation({
        onSuccess: () => {
            router.push("/ticketing");
        },
    });

    const showtimesByDate = useMemo(() => {
        const showtimes = payload?.showtimes ?? [];
        return groupShowtimesByDate(showtimes);
    }, [payload?.showtimes]);
    const availableDates = Array.from(showtimesByDate.keys());
    const effectiveDate = selectedDate ?? availableDates[0] ?? null;
    const selectedDayShowtimes = effectiveDate
        ? (showtimesByDate.get(effectiveDate) ?? [])
        : [];

    if (!isLoading && !payload) notFound();

    function handleSelectDate(date: string) {
        setSelectedDate(date);
        setSelectedShowtimeId(null);
    }

    function resetWatchPartyFlow() {
        setDialogOpen(false);
        setDialogStep("decision");
        setInviteEmails("");
        setSelectedShowtimeId(null);
        setActiveShowtime(null);
        createBookingSession.reset();
    }

    function handleSelectShowtime(showtime: Showtime) {
        setSelectedShowtimeId(showtime.id);
        setActiveShowtime(showtime);
        setDialogStep("decision");
        setInviteEmails("");
        setDialogOpen(true);
    }

    function handleBookWithoutWatchParty() {
        if (!activeShowtime) return;
        createBookingSession.mutate({ showtimeId: activeShowtime.id });
    }

    function handleSendEmails() {
        resetWatchPartyFlow();
    }

    return (
        <>
            <section className="mx-auto w-full max-w-7xl px-6">
                <div className="mb-8">
                    <Link
                        href={`/movies/${movieId}`}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition"
                    >
                        <span aria-hidden="true">←</span>
                        Back to details
                    </Link>
                </div>

                <Card className="glass-panel overflow-hidden rounded-3xl border">
                    <CardContent className="grid gap-8 p-6 lg:grid-cols-[320px_1fr_300px] lg:p-8">
                        {payload?.movie && <MoviePoster {...payload.movie} />}

                        {isLoading ? (
                            <p className="text-muted-foreground text-sm">
                                Loading showtimes…
                            </p>
                        ) : (
                            <ShowtimePicker
                                showtimes={selectedDayShowtimes}
                                selectedShowtimeId={selectedShowtimeId}
                                onSelect={handleSelectShowtime}
                            />
                        )}

                        {isLoading ? (
                            <></>
                        ) : availableDates.length > 0 ? (
                            <DateList
                                availableDates={availableDates}
                                showtimesByDate={showtimesByDate}
                                effectiveDate={effectiveDate}
                                onSelectDate={handleSelectDate}
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No upcoming showtimes available yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <WatchPartyDialog
                open={dialogOpen}
                movieTitle={payload?.movie?.title}
                showtime={activeShowtime}
                step={dialogStep}
                inviteEmails={inviteEmails}
                bookingPending={createBookingSession.isPending}
                bookingError={
                    createBookingSession.error
                        ? "Unable to start the regular booking flow right now. Please try again."
                        : undefined
                }
                onInviteEmailsChange={setInviteEmails}
                onCancel={resetWatchPartyFlow}
                onBack={() => setDialogStep("decision")}
                onChooseRegularBooking={handleBookWithoutWatchParty}
                onChooseWatchParty={() => setDialogStep("invite")}
                onSendEmails={handleSendEmails}
            />
        </>
    );
}

export default function MovieShowtimesPage({ params }: ShowtimesPageProps) {
    const { movieId } = use(params);

    return <MovieShowtimesPageContent movieId={movieId} />;
}
