"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { InviteCodePanel } from "~/components/watch-party/invite-code-panel";
import { PartySection } from "~/components/watch-party/party-section";
import { type WatchPartyListItem } from "~/components/watch-party/types";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";

export default function WatchPartyPage() {
    const router = useRouter();
    const [inviteCode, setInviteCode] = useState("");

    const utils = api.useUtils();
    const partiesQuery = api.watchParty.listMine.useQuery(undefined, {
        retry: false,
    });
    const [inviteCodeMessage, setInviteCodeMessage] = useState<string | null>(
        null
    );

    const joinByInviteCode = api.watchParty.joinByInviteCode.useMutation({
        onSuccess: async (result) => {
            setInviteCodeMessage(result.message);

            if (!result.ok || !result.partyId) {
                return;
            }

            setInviteCode("");
            await utils.watchParty.listMine.invalidate();
            router.push(`/watch-party/${result.partyId}`);
        },
    });

    const isUnauthorized = partiesQuery.error?.data?.code === "UNAUTHORIZED";
    const createdParties: WatchPartyListItem[] =
        partiesQuery.data?.createdParties ?? [];
    const joinedParties: WatchPartyListItem[] =
        partiesQuery.data?.joinedParties ?? [];

    const handleJoinParty = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        await joinByInviteCode.mutateAsync({
            inviteCode,
        });
    };

    return (
        <section className="space-y-8 py-10 md:py-14">
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
                <Card className="glass-card rounded-[1.75rem] border-white/10 bg-transparent shadow-none">
                    <CardContent className="space-y-6 p-6 md:p-8">
                        <div className="space-y-2">
                            <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-100 uppercase">
                                Watch Party
                            </div>
                            <h1 className="text-3xl font-bold text-white md:text-4xl">
                                Your Watch Parties
                            </h1>
                            <p className="text-muted-foreground max-w-2xl leading-7">
                                Keep track of parties you created and parties
                                you joined with an invitation code.
                            </p>
                        </div>

                        {isUnauthorized ? null : partiesQuery.isLoading ? (
                            <p className="text-muted-foreground">
                                Loading parties...
                            </p>
                        ) : (
                            <div className="space-y-6">
                                <PartySection
                                    title="Watch Party Created"
                                    emptyTitle="No parties created yet"
                                    emptyMessage="When you create a party, it will appear here."
                                    parties={createdParties}
                                    roleLabel="Leader"
                                />
                                    title="Watch Party Joined"
                                    emptyTitle="No parties joined yet"
                                    emptyMessage="When you open a party with an invitation code, it will appear here."
                                    parties={joinedParties}
                                    roleLabel="Guest"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <form className="h-full" onSubmit={handleJoinParty}>
                    <InviteCodePanel
                        inviteCode={inviteCode}
                        inviteCodeMessage={inviteCodeMessage}
                        isPending={joinByInviteCode.isPending}
                        isUnauthorized={isUnauthorized}
                        onInviteCodeChange={setInviteCode}
                    />
                </form>
            </div>
        </section>
    );
}
