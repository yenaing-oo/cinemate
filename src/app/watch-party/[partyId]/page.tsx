import { WatchPartyDetailView } from "~/components/watch-party/watch-party-detail-view";

export default async function WatchPartyDetailPage({
    params,
}: {
    params: Promise<{ partyId: string }>;
}) {
    const { partyId } = await params;
    return <WatchPartyDetailView partyId={partyId} />;
}
