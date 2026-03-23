"use client";

import { Plus, X } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { MAX_WATCH_PARTY_INVITES } from "~/lib/watch-party/invite";

type WatchPartyInviteEmailFieldsProps = {
    addRowError?: string;
    inputId: string;
    inviteEmails: string[];
    onAddInviteEmail: () => void;
    onRecipientInputChange: (value: string) => void;
    onRemoveInviteEmail: (index: number) => void;
    recipientInput: string;
};

export function WatchPartyInviteEmailFields({
    addRowError,
    inputId,
    inviteEmails,
    onAddInviteEmail,
    onRecipientInputChange,
    onRemoveInviteEmail,
    recipientInput,
}: WatchPartyInviteEmailFieldsProps) {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-2">
                <Label htmlFor={inputId} className="text-sm font-semibold">
                    Add recipient
                </Label>
                <p className="text-muted-foreground mt-1 text-sm">
                    You can invite up to {MAX_WATCH_PARTY_INVITES} people to a
                    watch party.
                </p>
                <div className="mt-2 flex items-center gap-3">
                    <Input
                        id={inputId}
                        type="email"
                        value={recipientInput}
                        onChange={(event) =>
                            onRecipientInputChange(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                onAddInviteEmail();
                            }
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
                        onClick={onAddInviteEmail}
                        disabled={
                            inviteEmails.length >= MAX_WATCH_PARTY_INVITES
                        }
                        aria-label="Add recipient"
                    >
                        <Plus />
                    </Button>
                </div>
                {addRowError ? (
                    <p className="text-destructive text-xs">{addRowError}</p>
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
                            <span className="text-sm">{email}</span>
                            <button
                                type="button"
                                onClick={() => onRemoveInviteEmail(index)}
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
    );
}
