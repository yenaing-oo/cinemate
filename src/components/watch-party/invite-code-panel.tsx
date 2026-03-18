"use client";

import Link from "next/link";
import { LoaderCircle, Sparkles, Ticket, Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

type InviteCodePanelProps = {
    inviteCode: string;
    inviteCodeMessage: string | null;
    isPending: boolean;
    isUnauthorized: boolean;
    onInviteCodeChange: (value: string) => void;
};

export function InviteCodePanel({
    inviteCode,
    inviteCodeMessage,
    isPending,
    isUnauthorized,
    onInviteCodeChange,
}: InviteCodePanelProps) {
    return (
        <Card className="glass-card h-full rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
            <CardContent className="flex h-full flex-col gap-6 p-6 md:p-8">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white md:text-3xl">
                        Open with invitation code
                    </h1>
                    <p className="text-muted-foreground leading-7">
                        Enter the code you received and jump straight into that
                        party.
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
                                    )
                                }
                                placeholder="AB12CD34"
                                minLength={4}
                                maxLength={32}
                                required
                            />
                        </label>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={
                                isPending || inviteCode.trim().length === 0
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

                        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/8 p-4">
                            <div className="flex items-center gap-2 text-cyan-100">
                                <Sparkles className="h-4 w-4" />
                                <p className="text-sm font-semibold">
                                    What happens next
                                </p>
                            </div>
                            <p className="text-muted-foreground mt-2 text-sm leading-6">
                                Enter the invitation code to open the matching
                                party and review the details shared with your
                                group.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
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
                                    Check the party details, confirm the plan,
                                    and get ready for the next booking step.
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/movies"
                            className="text-primary inline-flex text-sm font-medium transition hover:text-cyan-200"
                        >
                            Browse movies instead
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
