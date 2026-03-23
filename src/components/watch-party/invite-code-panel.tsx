"use client";

import Link from "next/link";
import { LoaderCircle, Sparkles, Ticket, Users } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { WATCH_PARTY_INVITE_CODE_LENGTH } from "~/lib/watch-party/invite";
import { formatShowtimeDate, formatShowtimeTime } from "~/lib/utils";
import { type WatchPartyListItem } from "~/lib/watch-party/types";
import {
    getWatchPartyStatusBadgeClassName,
    getWatchPartyStatusLabel,
} from "~/components/watch-party/watch-party-status";

type InviteCodePanelProps = {
    inviteCode: string;
    inviteCodeMessage: string | null;
    isPending: boolean;
    isUnauthorized: boolean;
    onInviteCodeChange: (value: string) => void;
    recentJoinedParty?: WatchPartyListItem | null;
};

export function InviteCodePanel({
    inviteCode,
    inviteCodeMessage,
    isPending,
    isUnauthorized,
    onInviteCodeChange,
    recentJoinedParty,
}: InviteCodePanelProps) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="h-full w-full"
        >
            <Card className="h-full rounded-[1.75rem] border border-white/10 bg-[#0e1b2f] shadow-none">
                <CardContent className="flex h-full flex-col gap-6 p-6 md:p-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-white md:text-4xl">
                            Open with invitation code
                        </h1>
                        <p className="text-muted-foreground leading-7">
                            Enter the code you received and jump straight into
                            that party.
                        </p>
                    </div>

                    {isUnauthorized ? (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-white">
                                Sign in to open a Watch Party
                            </h2>
                            <p className="text-muted-foreground leading-7">
                                Invitation codes are linked to your account.
                            </p>
                            <Link href="/auth/login" className="btn-primary">
                                Go to login
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-100">
                                    Invitation code
                                </span>
                                <Input
                                    value={inviteCode}
                                    onChange={(event) =>
                                        onInviteCodeChange(
                                            event.target.value
                                                .toUpperCase()
                                                .replace(/\s+/g, "")
                                                .slice(
                                                    0,
                                                    WATCH_PARTY_INVITE_CODE_LENGTH
                                                )
                                        )
                                    }
                                    placeholder="ABC1234"
                                    minLength={WATCH_PARTY_INVITE_CODE_LENGTH}
                                    maxLength={WATCH_PARTY_INVITE_CODE_LENGTH}
                                    required
                                />
                            </label>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={
                                    isPending ||
                                    inviteCode.trim().length !==
                                        WATCH_PARTY_INVITE_CODE_LENGTH
                                }
                            >
                                {isPending ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        Opening party...
                                    </>
                                ) : (
                                    "Open Watch Party"
                                )}
                            </Button>

                            {inviteCodeMessage ? (
                                <p className="text-sm text-red-300">
                                    {inviteCodeMessage}
                                </p>
                            ) : null}

                            <div className="rounded-[1.5rem] border border-white/8 bg-[#121d31] p-4">
                                {recentJoinedParty ? (
                                    <>
                                        <div className="mb-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-white">
                                                    Recent joined party
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    Your latest shared booking
                                                    plan
                                                </p>
                                            </div>
                                            <span
                                                className={getWatchPartyStatusBadgeClassName(
                                                    recentJoinedParty.status
                                                )}
                                            >
                                                {getWatchPartyStatusLabel(
                                                    recentJoinedParty.status
                                                )}
                                            </span>
                                        </div>

                                        <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-5">
                                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                <div className="space-y-2">
                                                    <p className="text-xl font-semibold text-white">
                                                        {recentJoinedParty.name}
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        {
                                                            recentJoinedParty
                                                                .showtime.movie
                                                                .title
                                                        }
                                                    </p>
                                                </div>

                                                <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white">
                                                    Participant
                                                </span>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-200">
                                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                                                    <Ticket className="h-4 w-4 text-cyan-100" />
                                                    <span>
                                                        {formatShowtimeDate(
                                                            recentJoinedParty
                                                                .showtime
                                                                .startTime
                                                        )}{" "}
                                                        at{" "}
                                                        {formatShowtimeTime(
                                                            recentJoinedParty
                                                                .showtime
                                                                .startTime
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                                                    <Users className="h-4 w-4 text-cyan-100" />
                                                    <span>
                                                        {
                                                            recentJoinedParty
                                                                ._count
                                                                .participants
                                                        }{" "}
                                                        joined
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-6 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">
                                                        Invite code
                                                    </p>
                                                    <p className="mt-1 font-semibold tracking-[0.22em] text-cyan-100">
                                                        {
                                                            recentJoinedParty.inviteCode
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">
                                                        Organizer
                                                    </p>
                                                    <p className="mt-1 font-medium text-slate-200">
                                                        {recentJoinedParty
                                                            .leader.name ??
                                                            recentJoinedParty
                                                                .leader.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] p-5">
                                        <p className="text-sm font-semibold text-white">
                                            Recent joined party
                                        </p>
                                        <p className="text-muted-foreground mt-2 text-sm leading-6">
                                            Once you join a watch party, the
                                            latest one appears here for quick
                                            access.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function InviteCodeDetails() {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="h-full w-full"
        >
            <Card className="glass-card h-full rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                <CardContent className="flex h-full flex-col gap-5 p-6 md:p-8">
                    <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/8 p-4">
                        <div className="flex items-center gap-2 text-cyan-100">
                            <Sparkles className="h-4 w-4" />
                            <p className="text-sm font-semibold">
                                What happens next
                            </p>
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm leading-6">
                            Enter the invitation code to open the matching party
                            and review the details shared with your group.
                        </p>
                    </div>

                    <div className="grid flex-1 gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-100">
                                <Users className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold text-white">
                                Join the group
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm leading-6">
                                Use a party code to open the shared plan and
                                stay aligned with everyone attending.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-100">
                                <Ticket className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold text-white">
                                Stay ready
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm leading-6">
                                Check the party details, confirm the plan, and
                                get ready for the next booking step.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/movies"
                        className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-sky-400/35 bg-sky-500/18 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-500/28"
                    >
                        Browse movies instead
                    </Link>
                </CardContent>
            </Card>
        </motion.div>
    );
}
