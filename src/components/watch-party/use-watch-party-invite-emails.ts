"use client";

import { useState } from "react";
import {
    hasWatchPartyInviteEmail,
    MAX_WATCH_PARTY_INVITES,
    watchPartyInviteEmailSchema,
    WATCH_PARTY_DUPLICATE_EMAIL_MESSAGE,
} from "~/lib/watch-party/invite";

export function useWatchPartyInviteEmails() {
    const [inviteEmails, setInviteEmails] = useState<string[]>([]);
    const [recipientInput, setRecipientInput] = useState("");
    const [addRowError, setAddRowError] = useState<string | undefined>();

    function handleRecipientInputChange(value: string) {
        setRecipientInput(value);
        setAddRowError(undefined);
    }

    function handleAddInviteEmail() {
        if (inviteEmails.length >= MAX_WATCH_PARTY_INVITES) {
            return;
        }

        const parsedEmail = watchPartyInviteEmailSchema.safeParse(
            recipientInput.trim()
        );

        if (!parsedEmail.success) {
            setAddRowError(parsedEmail.error.issues[0]?.message);
            return;
        }

        if (hasWatchPartyInviteEmail(inviteEmails, parsedEmail.data)) {
            setAddRowError(WATCH_PARTY_DUPLICATE_EMAIL_MESSAGE);
            return;
        }

        setInviteEmails((currentEmails) => [
            ...currentEmails,
            parsedEmail.data,
        ]);
        setRecipientInput("");
        setAddRowError(undefined);
    }

    function handleRemoveInviteEmail(index: number) {
        setInviteEmails((currentEmails) =>
            currentEmails.filter((_, currentIndex) => currentIndex !== index)
        );
        setAddRowError(undefined);
    }

    function resetInviteEmails() {
        setInviteEmails([]);
        setRecipientInput("");
        setAddRowError(undefined);
    }

    return {
        addRowError,
        handleAddInviteEmail,
        handleRecipientInputChange,
        handleRemoveInviteEmail,
        inviteEmails,
        recipientInput,
        resetInviteEmails,
    };
}
