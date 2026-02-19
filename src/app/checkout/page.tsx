import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { db } from "~/server/db";

interface CheckoutPageProps {
    searchParams?: Promise<{
        seatIds?: string | string[];
        seats?: string | string[];
    }>;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CAD",
});

const rowToLetter = (row: number) => String.fromCharCode(64 + Math.max(1, row));

const NoticeCard = ({
    title,
    message,
    actionLabel,
    actionHref,
}: {
    title: string;
    message: string;
    actionLabel: string;
    actionHref: string;
}) => (
    <section className="py-16">
        <Card className="glass-card border-border/60 bg-card/60 rounded-[28px] border shadow-[0_24px_60px_rgba(5,12,24,0.35)]">
            <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:gap-10">
                <div className="space-y-2">
                    <p className="text-muted-foreground/70 text-xs font-semibold tracking-[0.4em] uppercase">
                        {title}
                    </p>
                    <p className="text-foreground text-base font-semibold md:text-lg">
                        {message}
                    </p>
                </div>
                <Button
                    asChild
                    variant="default"
                    className="from-primary via-secondary to-accent text-primary-foreground w-full bg-gradient-to-r shadow-[0_16px_40px_rgba(32,201,255,0.35)] transition-all hover:shadow-[0_22px_55px_rgba(32,201,255,0.5)] md:w-auto"
                >
                    <Link href={actionHref}>{actionLabel}</Link>
                </Button>
            </CardContent>
        </Card>
    </section>
);

const reserveSeats = async (seatIds: string[]) => {
    const now = new Date();
    return db.$transaction(async (tx) => {
        const seats = await tx.showtimeSeat.findMany({
            where: { id: { in: seatIds } },
            include: {
                seat: true,
                showtime: {
                    include: {
                        movie: { select: { title: true } },
                    },
                },
            },
        });

        if (seats.length !== seatIds.length) {
            throw new Error("Some of the selected seats could not be found.");
        }

        const showtimeIds = new Set(seats.map((seat) => seat.showtimeId));
        if (showtimeIds.size !== 1) {
            throw new Error("Seats must belong to the same showtime.");
        }

        const unavailableSeats = seats.filter(
            (seat) => seat.status !== "AVAILABLE"
        );
        if (unavailableSeats.length > 0) {
            throw new Error(
                "One or more seats are already held or booked. Please select different seats."
            );
        }

        const updated = await tx.showtimeSeat.updateMany({
            where: { id: { in: seatIds }, status: "AVAILABLE" },
            data: {
                status: "RESERVED",
                heldAt: now,
            },
        });

        if (updated.count !== seatIds.length) {
            throw new Error(
                "Some seats became unavailable. Please select different seats."
            );
        }

        return { seats };
    });
};

const parseSeatIds = (value?: string | string[]) => {
    if (!value) return [];
    const list = Array.isArray(value) ? value : [value];
    return list
        .flatMap((entry) => entry.split(","))
        .map((entry) => entry.trim())
        .filter(Boolean);
};

export default async function CheckoutPage({
    searchParams,
}: CheckoutPageProps) {
    const resolvedSearchParams = await searchParams;
    const seatIds = Array.from(
        new Set([
            ...parseSeatIds(resolvedSearchParams?.seatIds),
            ...parseSeatIds(resolvedSearchParams?.seats),
        ])
    );

    if (seatIds.length === 0) {
        return (
            <NoticeCard
                title="Checkout"
                message="No seats were selected for checkout."
                actionLabel="Browse movies"
                actionHref="/movies"
            />
        );
    }

    let reservation;
    try {
        reservation = await reserveSeats(seatIds);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "We could not reserve your seats.";
        return (
            <NoticeCard
                title="Checkout"
                message={message}
                actionLabel="Pick seats again"
                actionHref="/movies"
            />
        );
    }

    const { seats } = reservation;
    const showtime = seats[0]?.showtime;

    if (!showtime) {
        return (
            <section className="py-16">
                <Card className="glass-panel rounded-2xl">
                    <CardContent className="space-y-4 p-6 text-center">
                        <p className="text-muted-foreground text-sm">
                            Movie not found
                        </p>
                        <Button asChild variant="shimmer">
                            <Link href="/movies">Browse movies</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        );
    }

    const sortedSeats = seats
        .map((seat) => ({
            id: seat.id,
            row: seat.seat.row,
            number: seat.seat.number,
            label: `${rowToLetter(seat.seat.row)}${seat.seat.number}`,
        }))
        .sort((a, b) =>
            a.row === b.row ? a.number - b.number : a.row - b.row
        );

    const unitPrice = Number(showtime.price);
    const totalPrice = Number((unitPrice * sortedSeats.length).toFixed(2));

    return (
        <section className="py-16">
            <div className="mb-8 space-y-3">
                <p className="text-muted-foreground/70 text-xs font-semibold tracking-[0.3em] uppercase">
                    Checkout
                </p>
                <h1 className="text-4xl font-bold">Review your booking</h1>
                <p className="text-muted-foreground text-sm">
                    Here is a summary of your selected seats.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Card className="glass-panel rounded-3xl">
                    <CardContent className="space-y-6 p-6">
                        <div>
                            <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">
                                Movie
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold">
                                {showtime?.movie?.title}
                            </h2>
                        </div>

                        <Separator className="bg-border/70" />

                        <div className="space-y-3">
                            <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">
                                Seats
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {sortedSeats.map((seat) => (
                                    <Badge
                                        key={seat.id}
                                        variant="outline"
                                        className="border-border/70 bg-muted/40 text-sm"
                                    >
                                        {seat.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <Separator className="bg-border/70" />

                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                            <div className="border-border/60 bg-muted/30 rounded-2xl border p-4">
                                <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                                    Tickets
                                </p>
                                <p className="mt-2 text-lg font-semibold">
                                    {sortedSeats.length} total
                                </p>
                            </div>
                            <div className="border-border/60 bg-muted/30 rounded-2xl border p-4">
                                <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                                    Price each
                                </p>
                                <p className="mt-2 text-lg font-semibold">
                                    {currencyFormatter.format(unitPrice)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-border/60 bg-card/60 relative overflow-hidden rounded-3xl border shadow-[0_22px_60px_rgba(5,12,24,0.45)]">
                    <div className="from-primary via-secondary to-accent pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r" />
                    <CardContent className="relative space-y-6 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">
                                    Total
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {currencyFormatter.format(totalPrice)}
                                </p>
                            </div>
                        </div>

                        <div className="border-border/60 bg-muted/30 rounded-2xl border p-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Tickets
                                </span>
                                <span className="font-semibold">
                                    {sortedSeats.length}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Price each
                                </span>
                                <span className="font-semibold">
                                    {currencyFormatter.format(unitPrice)}
                                </span>
                            </div>
                        </div>

                        <p className="text-muted-foreground text-sm">
                            No payment details required yet.
                        </p>

                        <div className="space-y-3">
                            <Button
                                variant="default"
                                className="from-primary via-secondary to-accent text-primary-foreground hover:text-primary-foreground w-full cursor-pointer bg-gradient-to-r shadow-[0_16px_40px_rgba(32,201,255,0.35)] transition-all hover:shadow-[0_24px_60px_rgba(32,201,255,0.6)] hover:brightness-110 hover:saturate-150"
                            >
                                Confirm reservation
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="border-border/60 bg-muted/20 text-foreground hover:border-primary/40 hover:bg-muted/40 hover:text-foreground w-full transition-all hover:shadow-[0_14px_40px_rgba(32,201,255,0.15)]"
                            >
                                <Link href="/movies">Continue browsing</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
