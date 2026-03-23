import z from "zod";

export const WATCH_PARTY_INVITE_CODE_LENGTH = 7;
export const MIN_WATCH_PARTY_INVITES = 1;
export const MAX_WATCH_PARTY_INVITES = 5;

export const WATCH_PARTY_INVALID_EMAIL_MESSAGE =
    "Please enter a valid email address.";
export const WATCH_PARTY_DUPLICATE_EMAIL_MESSAGE =
    "This email has already been added.";
export const WATCH_PARTY_SELF_INVITE_MESSAGE =
    "You cannot invite yourself to a watch party. Please remove your email from the invite list.";

export const watchPartyInviteEmailSchema = z
    .string()
    .trim()
    .email(WATCH_PARTY_INVALID_EMAIL_MESSAGE);

export function normalizeWatchPartyInviteEmail(email: string) {
    return email.trim().toLowerCase();
}

export function hasWatchPartyInviteEmail(emails: string[], email: string) {
    const normalizedEmail = normalizeWatchPartyInviteEmail(email);

    return emails.some(
        (inviteEmail) =>
            normalizeWatchPartyInviteEmail(inviteEmail) === normalizedEmail
    );
}

export const watchPartyInviteEmailsSchema = z
    .array(watchPartyInviteEmailSchema)
    .min(MIN_WATCH_PARTY_INVITES)
    .max(MAX_WATCH_PARTY_INVITES)
    .superRefine((emails, ctx) => {
        const seenEmails = new Set<string>();

        for (const email of emails) {
            const normalizedEmail = normalizeWatchPartyInviteEmail(email);

            if (seenEmails.has(normalizedEmail)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: WATCH_PARTY_DUPLICATE_EMAIL_MESSAGE,
                });
                return;
            }

            seenEmails.add(normalizedEmail);
        }
    });
