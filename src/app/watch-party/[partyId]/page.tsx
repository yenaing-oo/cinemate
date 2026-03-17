import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "~/components/ui/card";
import { createClient } from "~/lib/supabase/server";
import { formatCad, formatShowtimeDate, formatShowtimeTime } from "~/lib/utils";
import { api } from "~/trpc/server";

export default async function WatchPartyDetailPage({
    params,
}: {
    params: Promise<{ partyId: string }>;
}) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
        redirect("/auth/login");
    }

    const { partyId } = await params;
    const result = await api.watchParty.getById({ partyId });

    if (!result.ok || !result.party) {
        notFound();
    }

    const { party, role } = result;

    return (
        <section className="space-y-8 py-10 md:py-14">
            <div className="flex items-center justify-between">
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

                <Link
                    href="/watch-party"
                    className="rounded-full border border-white/12 px-4 py-2 font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
                >
                    Back to parties
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <Card className="glass-card rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                    <CardContent className="space-y-6 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold tracking-[0.18em] text-cyan-100 uppercase">
                                    {role === "leader" ? "Leader view" : "Guest view"}
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-white">
                                    Party details
                                </h2>
                            </div>
                            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                                {party.status}
                            </span>
                        </div>

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
                                    {formatCad(Number(party.showtime.price ?? 0))}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                            <p className="text-sm font-semibold text-white">
                                Organizer
                            </p>
                            <p className="text-muted-foreground mt-1">
                                {party.leader.name ?? party.leader.email}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                            <p className="text-sm font-semibold text-white">
                                Next step
                            </p>
                            <p className="text-muted-foreground mt-1 leading-7">
                                {role === "leader"
                                    ? "Share the invite code with the group, then send everyone to checkout once they are ready."
                                    : "Use this page as your party reference, then continue to ticket selection when the organizer is ready."}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                    <CardContent className="space-y-5 p-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-white">
                                Party members
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {party._count.participants} guest
                                {party._count.participants === 1 ? "" : "s"} joined
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                                <p className="font-semibold text-white">
                                    {party.leader.name ?? party.leader.email}
                                </p>
                                <p className="text-sm text-cyan-100">Leader</p>
                            </div>

                            {party.participants.length === 0 ? (
                                <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                                    <p className="text-muted-foreground">
                                        No guests have joined with the invite code yet.
                                    </p>
                                </div>
                            ) : (
                                party.participants.map((participant) => (
                                    <div
                                        key={participant.id}
                                        className="rounded-2xl border border-white/10 bg-white/4 p-4"
                                    >
                                        <p className="font-medium text-white">
                                            {participant.user.name ??
                                                participant.user.email}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            Joined party
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
