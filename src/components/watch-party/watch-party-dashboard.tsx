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
import { Button } from "~/components/ui/button";
import { PaymentDetailsForm } from "~/components/checkout/paymentDetailsForm";
import type { NewCardPaymentDetails } from "~/components/checkout/paymentDetails";
import { useAuthSession } from "~/lib/hooks/use-auth-session";
import { WATCH_PARTY_INVITE_CODE_LENGTH } from "~/lib/watch-party/invite";
import { api } from "~/trpc/react";

export function WatchPartyDashboard() {
    const router = useRouter();
    const utils = api.useUtils();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthSession();
    const [inviteCode, setInviteCode] = useState("");
    const [inviteCodeMessage, setInviteCodeMessage] = useState<string | null>(
        null
    );
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(
        null
    );
    const [paymentDetails, setPaymentDetails] =
        useState<NewCardPaymentDetails | null>(null);
    const [paymentDialogMessage, setPaymentDialogMessage] = useState<
        string | null
    >(null);

    const savedPaymentQuery = api.paymentMethod.getSaved.useQuery(undefined, {
        enabled: isAuthenticated === true,
    });

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

    const savePaymentMethod = api.paymentMethod.save.useMutation({
        onSuccess: async () => {
            await utils.paymentMethod.getSaved.invalidate();
        },
    });

    const createdParties = watchPartiesQuery.data?.createdParties ?? [];
    const isWatchPartyListLoading =
        isAuthenticated === true && watchPartiesQuery.isLoading;

    const joinPartyWithInviteCode = async (normalizedInviteCode: string) => {
        await joinWatchParty
            .mutateAsync({
                inviteCode: normalizedInviteCode,
            })
            .catch(() => {
                // The mutation's onError handler already sets the user-facing message.
            });
    };

    const handleSavePaymentAndJoin = async () => {
        if (!paymentDetails || !pendingInviteCode) {
            setPaymentDialogMessage("Enter valid payment details to continue.");
            return;
        }

        setPaymentDialogMessage(null);

        try {
            await savePaymentMethod.mutateAsync({
                cardNumber: paymentDetails.cardNumber,
            });

            const inviteCodeToJoin = pendingInviteCode;
            setPendingInviteCode(null);
            setPaymentDetails(null);
            setIsPaymentDialogOpen(false);
            toast.success("Payment method saved.");

            await joinPartyWithInviteCode(inviteCodeToJoin);
        } catch (error) {
            setPaymentDialogMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to save payment details right now."
            );
        }
    };

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

        if (normalizedInviteCode.length !== WATCH_PARTY_INVITE_CODE_LENGTH) {
            setInviteCodeMessage(
                `Invitation code must be ${WATCH_PARTY_INVITE_CODE_LENGTH} characters.`
            );
            return;
        }

        setInviteCodeMessage(null);

        if (savedPaymentQuery.isLoading) {
            setInviteCodeMessage("Checking your saved payment method...");
            return;
        }

        if (!savedPaymentQuery.data?.hasSavedCard) {
            setPendingInviteCode(normalizedInviteCode);
            setPaymentDetails(null);
            setIsPaymentDialogOpen(true);
            return;
        }

        await joinPartyWithInviteCode(normalizedInviteCode);
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
                                />
                                <PartySection
                                    title="Watch Party Joined"
                                    emptyTitle="No parties joined yet"
                                    emptyMessage="When you join a party with an invitation code, it will appear here."
                                    parties={
                                        watchPartiesQuery.data?.joinedParties ??
                                        []
                                    }
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {isPaymentDialogOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                    <Card className="glass-panel w-full max-w-2xl rounded-3xl border border-[#2b74c6]/52 bg-[#0a1e39]/90 shadow-xl shadow-slate-950/40">
                        <CardContent className="space-y-5 p-6">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight text-white">
                                    Add a payment method
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    You need a saved card on file before joining
                                    a watch party.
                                </p>
                                {paymentDialogMessage ? (
                                    <p className="text-sm text-red-300">
                                        {paymentDialogMessage}
                                    </p>
                                ) : null}
                            </div>

                            <PaymentDetailsForm
                                onValidPaymentChange={setPaymentDetails}
                            />

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    disabled={
                                        savePaymentMethod.isPending ||
                                        joinWatchParty.isPending
                                    }
                                    onClick={() => {
                                        setIsPaymentDialogOpen(false);
                                        setPendingInviteCode(null);
                                        setPaymentDetails(null);
                                        setPaymentDialogMessage(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={
                                        savePaymentMethod.isPending ||
                                        joinWatchParty.isPending ||
                                        paymentDetails === null
                                    }
                                    onClick={() => {
                                        void handleSavePaymentAndJoin();
                                    }}
                                >
                                    {savePaymentMethod.isPending
                                        ? "Saving card..."
                                        : "Save and join"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </section>
    );
}
