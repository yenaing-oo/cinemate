import { WatchPartyDetailView } from "~/components/watch-party/watch-party-detail-view";

// Loads one watch party detail page from the dynamic route id.
export default async function WatchPartyDetailPage({
    params,
}: {
    params: Promise<{ partyId: string }>;
}) {
    const { partyId } = await params;
    return <WatchPartyDetailView partyId={partyId} />;
}
