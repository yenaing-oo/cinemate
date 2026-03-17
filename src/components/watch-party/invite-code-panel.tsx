"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
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
        <div className="glass-panel rounded-[2rem] border border-white/10 px-6 py-8 md:px-10 md:py-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-100 uppercase">
                        Watch Party
                    </div>
                    <h1 className="text-3xl font-bold text-white md:text-4xl">
                        Open a Watch Party with an invitation code
                    </h1>
                    <p className="text-muted-foreground max-w-2xl leading-7">
                        Enter the code you received and jump straight into that
                        party.
                    </p>
                </div>

                <Link
                    href="/movies"
                    className="text-primary text-sm font-medium transition hover:text-cyan-200"
                >
                    Browse movies
                </Link>
            </div>

            <Card className="glass-card mt-6 rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                <CardContent className="p-6">
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
                        <>
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-100">
                                    Invitation code
                                </span>
                                <div className="flex flex-col gap-4 md:flex-row md:items-end">
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

                                    <Button
                                        type="submit"
                                        className="md:min-w-52"
                                        disabled={
                                            isPending ||
                                            inviteCode.trim().length === 0
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
                                </div>
                            </label>

                            {inviteCodeMessage ? (
                                <p className="mt-3 text-sm text-red-300">
                                    {inviteCodeMessage}
                                </p>
                            ) : null}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
