"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { InviteCodePanel } from "~/components/watch-party/invite-code-panel";
import { PartySection } from "~/components/watch-party/party-section";
import { type WatchPartyListItem } from "~/components/watch-party/types";
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
            <form onSubmit={handleJoinParty}>
                <InviteCodePanel
                    inviteCode={inviteCode}
                    inviteCodeMessage={inviteCodeMessage}
                    isPending={joinByInviteCode.isPending}
                    isUnauthorized={isUnauthorized}
                    onInviteCodeChange={setInviteCode}
                />
            </form>

            <div className="space-y-6">
                {isUnauthorized ? null : partiesQuery.isLoading ? (
                    <p className="text-muted-foreground">Loading parties...</p>
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
                            emptyMessage="When you open a party with an invitation code, it will appear here."
                            parties={joinedParties}
                            roleLabel="Guest"
                        />
                    </div>
                )}
            </div>
        </section>
    );
}
