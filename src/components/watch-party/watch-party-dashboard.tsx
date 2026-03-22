"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
    InviteCodeDetails,
    InviteCodePanel,
} from "~/components/watch-party/invite-code-panel";
import { PartySection } from "~/components/watch-party/party-section";
import { Spinner } from "~/components/ui/spinner";
import { Card, CardContent } from "~/components/ui/card";
import { useAuthSession } from "~/lib/hooks/use-auth-session";
import { api } from "~/trpc/react";

export function WatchPartyDashboard() {
    const router = useRouter();
    const utils = api.useUtils();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthSession();
    const [inviteCode, setInviteCode] = useState("");
    const [inviteCodeMessage, setInviteCodeMessage] = useState<string | null>(
        null
    );

    const watchPartiesQuery = api.watchParty.listMine.useQuery(undefined, {
        enabled: isAuthenticated === true,
    });

    const joinWatchParty = api.watchParty.join.useMutation({
        onSuccess: async (result) => {
            await utils.watchParty.listMine.invalidate();
            setInviteCode("");
            setInviteCodeMessage(null);

            if (result.joined) {
                toast.success("You joined the watch party.");
            }

            router.push(`/watch-party/${result.id}`);
        },
        onError: (error) => {
            setInviteCodeMessage(
                error.message ||
                    "Unable to open that watch party right now. Please try again."
            );
        },
    });

    const createdParties = watchPartiesQuery.data?.createdParties ?? [];
    const joinedParties = watchPartiesQuery.data?.joinedParties ?? [];
    const isWatchPartyListLoading =
        isAuthenticated === true && watchPartiesQuery.isLoading;

    const handleJoinParty = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedInviteCode = inviteCode.trim().toUpperCase();

        if (!normalizedInviteCode) {
            return;
        }

        if (isAuthenticated !== true) {
            setInviteCodeMessage("Sign in to open a watch party.");
            return;
        }

        setInviteCodeMessage(null);

        await joinWatchParty
            .mutateAsync({
                inviteCode: normalizedInviteCode,
            })
            .catch(() => {
                // The mutation's onError handler already sets the user-facing message.
            });
    };

    return (
        <section className="space-y-8 py-10 md:py-14">
            <div className="grid items-stretch gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <motion.form
                    className="h-full"
                    onSubmit={handleJoinParty}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.45,
                        ease: "easeOut",
                    }}
                >
                    <InviteCodePanel
                        inviteCode={inviteCode}
                        inviteCodeMessage={inviteCodeMessage}
                        isPending={joinWatchParty.isPending}
                        isUnauthorized={isAuthenticated === false}
                        onInviteCodeChange={(value) => {
                            setInviteCode(value);
                            setInviteCodeMessage(null);
                        }}
                        recentJoinedParty={joinedParties[0] ?? null}
                    />
                </motion.form>

                <motion.div
                    className="h-full"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                        duration: 0.45,
                        delay: 0.06,
                        ease: "easeOut",
                    }}
                >
                    <InviteCodeDetails />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
            >
                <Card className="glass-card rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                    <CardContent className="space-y-6 p-6 md:p-8">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-white md:text-4xl">
                                Your Watch Parties
                            </h1>
                            <p className="text-muted-foreground max-w-2xl leading-7">
                                Keep track of parties you created and parties
                                you joined with an invitation code.
                            </p>
                            {isAuthenticated === false ? (
                                <p className="text-muted-foreground text-sm">
                                    Sign in to see your created and joined watch
                                    parties.
                                </p>
                            ) : null}
                            {watchPartiesQuery.error ? (
                                <p className="text-sm text-red-300">
                                    {watchPartiesQuery.error.message}
                                </p>
                            ) : null}
                        </div>

                        {isAuthLoading || isWatchPartyListLoading ? (
                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Spinner />
                                Loading your watch parties...
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <PartySection
                                    title="Watch Party Created"
                                    emptyTitle="No parties created yet"
                                    emptyMessage="When you create a party, it will appear here."
                                    parties={createdParties}
                                    roleLabel="Leader"
                                />
                                <PartySection
                                    title="Watch Party Joined"
                                    emptyTitle="No parties joined yet"
                                    emptyMessage="When you join a party with an invitation code, it will appear here."
                                    parties={joinedParties}
                                    roleLabel="Participant"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </section>
    );
}
