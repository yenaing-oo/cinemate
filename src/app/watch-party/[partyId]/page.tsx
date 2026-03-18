import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { formatCad, formatShowtimeDate, formatShowtimeTime } from "~/lib/utils";

export default async function WatchPartyDetailPage({
    params,
}: {
    params: Promise<{ partyId: string }>;
}) {
    const { partyId } = await params;
    const party = createMockParty(partyId);

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
                        {party.movieTitle} on{" "}
                        {formatShowtimeDate(party.startTime)} at{" "}
                        {formatShowtimeTime(party.startTime)}
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
                                    UI preview
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
                                    {formatCad(party.ticketPrice)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                            <p className="text-sm font-semibold text-white">
                                Organizer
                            </p>
                            <p className="text-muted-foreground mt-1">
                                {party.organizer}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                            <p className="text-sm font-semibold text-white">
                                Next step
                            </p>
                            <p className="text-muted-foreground mt-1 leading-7">
                                This is a frontend preview page. Real backend
                                data can be connected here later.
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
                                {party.members.length - 1} guests joined
                            </p>
                        </div>

                        <div className="space-y-3">
                            {party.members.map((member) => (
                                <div
                                    key={member.name}
                                    className={`rounded-2xl border p-4 ${
                                        member.role === "Leader"
                                            ? "border-cyan-300/20 bg-cyan-300/10"
                                            : "border-white/10 bg-white/4"
                                    }`}
                                >
                                    <p className="font-semibold text-white">
                                        {member.name}
                                    </p>
                                    <p
                                        className={`text-sm ${
                                            member.role === "Leader"
                                                ? "text-cyan-100"
                                                : "text-muted-foreground"
                                        }`}
                                    >
                                        {member.role}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}

function createMockParty(partyId: string) {
    const inviteCode = partyId.slice(0, 8).toUpperCase();

    return {
        name: `Watch Party ${inviteCode || "Preview"}`,
        movieTitle: "Watch Party Preview",
        startTime: new Date("2026-03-20T19:30:00"),
        inviteCode: inviteCode || "AB12CD34",
        ticketPrice: 18.5,
        organizer: "Demo Organizer",
        status: "OPEN",
        members: [
            { name: "Demo Organizer", role: "Leader" },
            { name: "Alex Guest", role: "Joined party" },
            { name: "Sam Guest", role: "Joined party" },
        ],
    };
}
