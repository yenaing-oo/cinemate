"use client";

import { type FormEvent, useState } from "react";
import { InviteCodePanel } from "~/components/watch-party/invite-code-panel";
import { PartySection } from "~/components/watch-party/party-section";
import { type WatchPartyListItem } from "~/components/watch-party/types";
import { Card, CardContent } from "~/components/ui/card";

export default function WatchPartyPage() {
    const [inviteCode, setInviteCode] = useState("");
    const [inviteCodeMessage, setInviteCodeMessage] = useState<string | null>(
        null
    );
    const [isOpeningInvite, setIsOpeningInvite] = useState(false);
    const [createdParties] = useState<WatchPartyListItem[]>([]);
    const [joinedParties] = useState<WatchPartyListItem[]>([]);

    const handleJoinParty = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedInviteCode = inviteCode.trim().toUpperCase();

        if (!normalizedInviteCode) {
            return;
        }

        setIsOpeningInvite(true);
        setInviteCodeMessage(null);

        await new Promise((resolve) => setTimeout(resolve, 400));

        setInviteCode("");
        setInviteCodeMessage("Invite code preview only.");
        setIsOpeningInvite(false);
    };

    return (
        <section className="space-y-8 py-10 md:py-14">
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
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
                        </div>

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
                                emptyMessage="When you open a party with an invitation code, it will appear here."
                                parties={joinedParties}
                                roleLabel="Guest"
                            />
                        </div>
                    </CardContent>
                </Card>

                <form className="h-full" onSubmit={handleJoinParty}>
                    <InviteCodePanel
                        inviteCode={inviteCode}
                        inviteCodeMessage={inviteCodeMessage}
                        isPending={isOpeningInvite}
                        isUnauthorized={false}
                        onInviteCodeChange={setInviteCode}
                    />
                </form>
            </div>
        </section>
    );
}
