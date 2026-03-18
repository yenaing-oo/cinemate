import Link from "next/link";
import { ArrowRight, Ticket, Users } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { formatShowtimeDate, formatShowtimeTime } from "~/lib/utils";
import { type WatchPartyListItem } from "~/components/watch-party/types";

type PartySectionProps = {
    title: string;
    emptyTitle: string;
    emptyMessage: string;
    parties: WatchPartyListItem[];
    roleLabel: string;
};

export function PartySection({
    title,
    emptyTitle,
    emptyMessage,
    parties,
    roleLabel,
}: PartySectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-muted-foreground text-sm">
                    {parties.length}{" "}
                    {parties.length === 1 ? "party" : "parties"}
                </p>
            </div>

            {parties.length === 0 ? (
                <div className="glass-card rounded-[1.5rem] border border-white/10 px-6 py-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-100">
                        <Users className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-semibold text-white">
                        {emptyTitle}
                    </h4>
                    <p className="text-muted-foreground mx-auto mt-2 max-w-xl leading-7">
                        {emptyMessage}
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
                                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                        {roleLabel}
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
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-cyan-100" />
                                        <span>
                                            Leader:{" "}
                                            {party.leader.name ??
                                                party.leader.email}
                                            {" · "}
                                            {party._count.participants} joined
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground">
                                        Invite code:{" "}
                                        <span className="font-semibold tracking-[0.2em] text-white">
                                            {party.inviteCode}
                                        </span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Status:{" "}
                                        <span className="font-semibold text-white">
                                            {party.status}
                                        </span>
                                    </p>
                                </div>

                                <Link
                                    href={`/watch-party/${party.id}`}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition hover:text-cyan-200"
                                >
                                    Open party
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
