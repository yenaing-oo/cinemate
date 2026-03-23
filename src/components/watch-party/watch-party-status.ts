import { cn } from "~/lib/utils";
import type { WatchPartyStatusValue } from "~/lib/watch-party/types";

const WATCH_PARTY_STATUS_META: Record<
    WatchPartyStatusValue,
    {
        label: string;
        badgeClassName: string;
    }
> = {
    ACTIVE: {
        label: "Open",
        badgeClassName: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    },
    IN_PROGRESS: {
        label: "Booking",
        badgeClassName: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    },
    CONFIRMED: {
        label: "Booked",
        badgeClassName:
            "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    },
};

export function getWatchPartyStatusLabel(status: WatchPartyStatusValue) {
    return WATCH_PARTY_STATUS_META[status].label;
}

export function getWatchPartyStatusBadgeClassName(
    status: WatchPartyStatusValue
) {
    return cn(
        "rounded-full border px-3 py-1 text-xs font-semibold",
        WATCH_PARTY_STATUS_META[status].badgeClassName
    );
}
