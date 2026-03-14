"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Plus, Ticket, Users } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { formatCad, formatShowtimeDate, formatShowtimeTime } from "~/lib/utils";

export default function WatchPartyPage() {
    const [selectedMovieId, setSelectedMovieId] = useState("");
    const [selectedShowtimeId, setSelectedShowtimeId] = useState("");
    const [partyName, setPartyName] = useState("");

    const utils = api.useUtils();
    const moviesQuery = api.movies.nowPlaying.useQuery({ limit: 12 });
    const partiesQuery = api.watchParty.listMine.useQuery(undefined, {
        retry: false,
    });
    const [createPartyMessage, setCreatePartyMessage] = useState<string | null>(
        null
    );

    const showtimesQuery = api.showtimes.getByMovie.useQuery(
        { movieId: selectedMovieId },
        {
            enabled: selectedMovieId.length > 0,
        }
    );

    const createParty = api.watchParty.create.useMutation({
        onSuccess: async (result) => {
            setCreatePartyMessage(result.message);

            if (!result.ok) {
                return;
            }

            setPartyName("");
            setSelectedShowtimeId("");
            await Promise.all([
                utils.watchParty.listMine.invalidate(),
                utils.showtimes.getByMovie.invalidate(),
            ]);
        },
    });

    const movies = moviesQuery.data ?? [];
    const showtimes = showtimesQuery.data?.showtimes ?? [];
    const selectedShowtime = useMemo(
        () => showtimes.find((showtime) => showtime.id === selectedShowtimeId),
        [selectedShowtimeId, showtimes]
    );
    const isUnauthorized = partiesQuery.error?.data?.code === "UNAUTHORIZED";
    const parties = partiesQuery.data?.parties ?? [];

    useEffect(() => {
        if (!selectedMovieId && movies.length > 0) {
            setSelectedMovieId(movies[0]!.id);
        }
    }, [selectedMovieId, movies]);

    useEffect(() => {
        if (
            selectedShowtimeId &&
            !showtimes.some((showtime) => showtime.id === selectedShowtimeId)
        ) {
            setSelectedShowtimeId("");
        }
    }, [selectedShowtimeId, showtimes]);

    const handleCreateParty = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedShowtimeId) {
            return;
        }

        await createParty.mutateAsync({
            name: partyName,
            showtimeId: selectedShowtimeId,
        });
    };

    return (
        <section className="space-y-8 py-10 md:py-14">
            <div className="glass-panel rounded-[2rem] border border-white/10 px-6 py-8 md:px-10 md:py-10">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-5">
                        <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-100 uppercase">
                            Watch Party
                        </div>
                        <div className="space-y-3">
                            <h1 className="max-w-3xl text-4xl font-bold md:text-5xl">
                                Create a party and invite the group from one
                                place.
                            </h1>
                            <p className="text-muted-foreground max-w-2xl text-lg leading-8">
                                Start the outing as the party leader, pick a
                                showtime, and generate a shareable invite code
                                for your friends.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                "Choose a movie and upcoming showtime",
                                "Create the party as organizer",
                                "Share the invite code with friends",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="glass-card rounded-2xl border border-white/10 px-4 py-4 text-sm text-slate-100"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Card className="glass-card rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                        <CardContent className="p-6">
                            {isUnauthorized ? (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-white">
                                        Sign in to create a Watch Party
                                    </h2>
                                    <p className="text-muted-foreground leading-7">
                                        Party creation is leader-specific, so it
                                        requires an account.
                                    </p>
                                    <Link
                                        href="/auth/login"
                                        className="btn-primary"
                                    >
                                        Go to login
                                    </Link>
                                </div>
                            ) : (
                                <form
                                    className="space-y-5"
                                    onSubmit={handleCreateParty}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-100">
                                            <Plus className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-semibold text-white">
                                                Create a party
                                            </h2>
                                            <p className="text-muted-foreground text-sm">
                                                Set the outing details for your
                                                group.
                                            </p>
                                        </div>
                                    </div>

                                    <label className="space-y-2">
                                        <span className="text-sm font-medium text-slate-100">
                                            Party name
                                        </span>
                                        <Input
                                            value={partyName}
                                            onChange={(event) =>
                                                setPartyName(event.target.value)
                                            }
                                            placeholder="Friday night crew"
                                            minLength={3}
                                            maxLength={80}
                                            required
                                        />
                                    </label>

                                    <label className="space-y-2">
                                        <span className="text-sm font-medium text-slate-100">
                                            Movie
                                        </span>
                                        <select
                                            className="bg-input/30 border-border text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                                            value={selectedMovieId}
                                            onChange={(event) =>
                                                setSelectedMovieId(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        >
                                            <option value="" disabled>
                                                Select a movie
                                            </option>
                                            {movies.map((movie) => (
                                                <option
                                                    key={movie.id}
                                                    value={movie.id}
                                                >
                                                    {movie.title}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="space-y-2">
                                        <span className="text-sm font-medium text-slate-100">
                                            Showtime
                                        </span>
                                        <select
                                            className="bg-input/30 border-border text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                                            value={selectedShowtimeId}
                                            onChange={(event) =>
                                                setSelectedShowtimeId(
                                                    event.target.value
                                                )
                                            }
                                            disabled={!selectedMovieId}
                                            required
                                        >
                                            <option value="" disabled>
                                                Select a showtime
                                            </option>
                                            {showtimes.map((showtime) => (
                                                <option
                                                    key={showtime.id}
                                                    value={showtime.id}
                                                >
                                                    {formatShowtimeDate(
                                                        showtime.startTime
                                                    )}{" "}
                                                    at{" "}
                                                    {formatShowtimeTime(
                                                        showtime.startTime
                                                    )}{" "}
                                                    ·{" "}
                                                    {formatCad(
                                                        showtime.price ?? 0
                                                    )}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    {selectedShowtime ? (
                                        <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-4">
                                            <p className="text-sm font-semibold text-white">
                                                Selected outing
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {formatShowtimeDate(
                                                    selectedShowtime.startTime
                                                )}{" "}
                                                at{" "}
                                                {formatShowtimeTime(
                                                    selectedShowtime.startTime
                                                )}{" "}
                                                ·{" "}
                                                {formatCad(
                                                    selectedShowtime.price ?? 0
                                                )}{" "}
                                                per ticket
                                            </p>
                                        </div>
                                    ) : null}

                                    {createPartyMessage ? (
                                        <p className="text-sm text-red-300">
                                            {createPartyMessage}
                                        </p>
                                    ) : null}

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={
                                            createParty.isPending ||
                                            !selectedShowtimeId
                                        }
                                    >
                                        {createParty.isPending ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                Creating party...
                                            </>
                                        ) : (
                                            "Create Watch Party"
                                        )}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                        Your Watch Parties
                    </h2>
                    <Link
                        href="/movies"
                        className="text-primary text-sm font-medium transition hover:text-cyan-200"
                    >
                        Browse movies
                    </Link>
                </div>

                {isUnauthorized ? null : partiesQuery.isLoading ? (
                    <p className="text-muted-foreground">Loading parties...</p>
                ) : parties.length === 0 ? (
                    <div className="glass-card rounded-[1.5rem] border border-white/10 px-6 py-10 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-100">
                            <Users className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">
                            No parties yet
                        </h3>
                        <p className="text-muted-foreground mx-auto mt-2 max-w-xl leading-7">
                            Create your first Watch Party to get a shareable
                            invite code for the group.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {parties.map((party) => (
                            <Card
                                key={party.id}
                                className="glass-card rounded-[1.5rem] border-white/10 bg-transparent shadow-none"
                            >
                                <CardContent className="space-y-4 p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xl font-semibold text-white">
                                                {party.name}
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {party.showtime.movie.title}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                                            {party.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-200">
                                        <div className="flex items-center gap-2">
                                            <Ticket className="h-4 w-4 text-cyan-100" />
                                            <span>
                                                {formatShowtimeDate(
                                                    party.showtime.startTime
                                                )}{" "}
                                                at{" "}
                                                {formatShowtimeTime(
                                                    party.showtime.startTime
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground">
                                            Invite code:{" "}
                                            <span className="font-semibold tracking-[0.2em] text-white">
                                                {party.inviteCode}
                                            </span>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
