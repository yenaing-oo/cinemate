"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import z from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { formatShowtimeDate, formatShowtimeTime } from "~/lib/utils";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export type WatchPartyDialogStep = "decision" | "invite";
export const MAX_WATCH_PARTY_INVITES = 5;

const inviteEmailSchema = z
    .string()
    .trim()
    .email("Please enter a valid email address.");

export function WatchPartyDialog({
    open,
    movieTitle,
    showtime,
    onClose,
}: {
    open: boolean;
    movieTitle?: string;
    showtime: { id: string; startTime: Date } | null;
    onClose: () => void;
}) {
    const [step, setStep] = useState<WatchPartyDialogStep>("decision");
    const [inviteEmails, setInviteEmails] = useState<string[]>([]);
    const [recipientInput, setRecipientInput] = useState("");
    const [addRowError, setAddRowError] = useState<string | undefined>();

    const router = useRouter();
    const utils = api.useUtils();

    const createBookingSession = api.bookingSession.create.useMutation({
        onSuccess: () => {
            router.push("/ticketing");
        },
    });

    const createWatchParty = api.watchParty.create.useMutation({});

    const stepActionPending =
        createBookingSession.isPending || createWatchParty.isPending;
    const bookingError = createBookingSession.error
        ? createBookingSession.error.message ||
          "Unable to book tickets right now. Please try again."
        : undefined;
    const watchPartyError = createWatchParty.error
        ? createWatchParty.error.message ||
          "Unable to create a watch party right now. Please try again."
        : undefined;

    if (!open || !showtime) return null;
    const activeShowtime = showtime;

    function resetDialogState() {
        setStep("decision");
        setInviteEmails([]);
        setRecipientInput("");
        setAddRowError(undefined);
    }

    function handleClose() {
        resetDialogState();
        createBookingSession.reset();
        createWatchParty.reset();
        onClose();
    }

    async function handleBookWithoutWatchParty() {
        await createBookingSession.mutateAsync({
            showtimeId: activeShowtime.id,
        });
    }

    async function handleSendInvitations(emails: string[]) {
        const watchParty = await createWatchParty.mutateAsync({
            showtimeId: activeShowtime.id,
            emails,
        });

        await utils.watchParty.listMine.invalidate();
        handleClose();
        router.push(`/watch-party/${watchParty.id}`);
    }

    function handleAddInviteEmailField() {
        if (inviteEmails.length >= MAX_WATCH_PARTY_INVITES) return;

        const valueToValidate = recipientInput.trim();
        const parsed = inviteEmailSchema.safeParse(valueToValidate);

        if (!parsed.success) {
            setAddRowError(parsed.error.issues[0]?.message);
            return;
        }

        const normalizedEmail = valueToValidate.toLowerCase();
        const isDuplicate = inviteEmails.some(
            (email) => email.toLowerCase() === normalizedEmail
        );

        if (isDuplicate) {
            setAddRowError("This email has already been added.");
            return;
        }

        setAddRowError(undefined);

        setInviteEmails((currentEmails) => [...currentEmails, valueToValidate]);
        setRecipientInput("");
    }

    function handleRemoveInviteEmailField(index: number) {
        setInviteEmails((currentEmails) => {
            const nextEmails = currentEmails.filter(
                (_, currentIndex) => currentIndex !== index
            );
            return nextEmails;
        });
        setAddRowError(undefined);
    }

    const inviteCount = inviteEmails.length;
    const showtimeLabel = `${formatShowtimeDate(activeShowtime.startTime)} at ${formatShowtimeTime(activeShowtime.startTime)}`;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center px-4 py-6">
                <Card
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="watch-party-dialog-title"
                    className="glass-panel relative flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 py-0 shadow-2xl shadow-black/40"
                >
                    <CardHeader className="relative gap-2 px-6 pt-6 pb-0">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="absolute top-5 right-5"
                            onClick={handleClose}
                            disabled={stepActionPending}
                            aria-label="Close dialog"
                        >
                            <X />
                        </Button>

                        <div className="pr-12">
                            <CardTitle
                                id="watch-party-dialog-title"
                                className="mt-2 text-2xl"
                            >
                                {step === "decision"
                                    ? "Do you want to create a watch party ?"
                                    : "Send invites for watch party"}
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent
                        className={
                            step === "decision"
                                ? "space-y-4 px-6 pt-5 pb-0"
                                : "flex min-h-0 flex-1 flex-col gap-5 px-6 pt-5 pb-0"
                        }
                    >
                        <div className="glass-card space-y-2 rounded-2xl border border-white/10 p-4">
                            <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
                                Selected showtime
                            </p>
                            <p className="text-base font-semibold">
                                {movieTitle}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                {showtimeLabel}
                            </p>
                        </div>

                        {step === "invite" ? (
                            <div className="flex min-h-0 flex-1 flex-col">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="watch-party-add-recipient"
                                        className="text-sm font-semibold"
                                    >
                                        Add recipient
                                    </Label>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        You can invite up to{" "}
                                        {MAX_WATCH_PARTY_INVITES} people to a
                                        watch party.
                                    </p>
                                    <div className="mt-2 flex items-center gap-3">
                                        <Input
                                            id="watch-party-add-recipient"
                                            type="email"
                                            value={recipientInput}
                                            onChange={(event) => {
                                                setRecipientInput(
                                                    event.target.value
                                                );
                                                setAddRowError(undefined);
                                            }}
                                            placeholder="name@example.com"
                                            className="bg-background/70 h-11 rounded-xl"
                                            aria-invalid={Boolean(addRowError)}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-sm"
                                            className="shrink-0"
                                            onClick={handleAddInviteEmailField}
                                            disabled={
                                                inviteEmails.length >=
                                                MAX_WATCH_PARTY_INVITES
                                            }
                                            aria-label="Add recipient"
                                        >
                                            <Plus />
                                        </Button>
                                    </div>
                                    {addRowError ? (
                                        <p className="text-destructive text-xs">
                                            {addRowError}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
                                    <div className="flex flex-wrap gap-2">
                                        {inviteEmails.map((email, index) => (
                                            <Badge
                                                key={`${email}-${index}`}
                                                variant="outline"
                                                className="flex items-center gap-2 py-1 pr-1 pl-3"
                                            >
                                                <span className="text-sm">
                                                    {email}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveInviteEmailField(
                                                            index
                                                        )
                                                    }
                                                    className="text-muted-foreground hover:text-foreground inline-flex h-5 w-5 items-center justify-center rounded-sm"
                                                    aria-label={`Remove ${email}`}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : bookingError ? (
                            <p className="text-destructive text-sm">
                                {bookingError}
                            </p>
                        ) : null}

                        {step === "invite" && watchPartyError ? (
                            <p className="text-destructive text-sm">
                                {watchPartyError}
                            </p>
                        ) : null}
                    </CardContent>

                    {step === "decision" ? (
                        <div className="grid shrink-0 gap-3 px-6 pt-5 pb-6 sm:grid-cols-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep("invite")}
                                disabled={stepActionPending}
                            >
                                Create watch party
                            </Button>
                            <Button
                                onClick={() =>
                                    void handleBookWithoutWatchParty()
                                }
                                disabled={stepActionPending}
                            >
                                {stepActionPending
                                    ? "Starting booking..."
                                    : "Continue with booking"}
                            </Button>
                        </div>
                    ) : (
                        <CardFooter className="shrink-0 flex-col gap-3 px-6 pt-5 pb-6 sm:flex-row sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setStep("decision")}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={() =>
                                    void handleSendInvitations(inviteEmails)
                                }
                                disabled={
                                    inviteCount === 0 || stepActionPending
                                }
                            >
                                {stepActionPending
                                    ? "Sending invitations..."
                                    : "Send invitations"}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}
