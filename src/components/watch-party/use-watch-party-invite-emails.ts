"use client";

import { useState } from "react";
import {
    hasWatchPartyInviteEmail,
    MAX_WATCH_PARTY_INVITES,
    watchPartyInviteEmailSchema,
    WATCH_PARTY_DUPLICATE_EMAIL_MESSAGE,
} from "~/lib/watch-party/invite";

/**
 * Centralizes invite-email entry state so the dialog and field components share
 * one validation flow and one source of truth for added recipients.
 */
export function useWatchPartyInviteEmails() {
    const [inviteEmails, setInviteEmails] = useState<string[]>([]);
    const [recipientInput, setRecipientInput] = useState("");
    const [addRowError, setAddRowError] = useState<string | undefined>();

    function handleRecipientInputChange(value: string) {
        setRecipientInput(value);
        setAddRowError(undefined);
    }

    /**
     * Validates and appends the current email input to the invite list.
     */
    function handleAddInviteEmail() {
        if (inviteEmails.length >= MAX_WATCH_PARTY_INVITES) {
            return;
        }

        // Reuse the shared schema so client-side validation matches the API
        // exactly, including trimming behavior and email error messages.
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

        // Preserve the parsed value so the stored list matches schema-trimmed
        // output instead of whatever spacing the user typed.
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

    /**
     * Clears all invite-entry state when the dialog closes or restarts.
     */
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
