const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export function getWatchPartyBookingDeadline(showtimeStartTime: Date | string) {
    return new Date(new Date(showtimeStartTime).getTime() - ONE_HOUR_IN_MS);
}

export function getWatchPartyTimeLeftMs(
    showtimeStartTime: Date | string,
    now: Date = new Date()
) {
    return (
        getWatchPartyBookingDeadline(showtimeStartTime).getTime() -
        now.getTime()
    );
}

export function isWatchPartyBookable(
    showtimeStartTime: Date | string,
    now: Date = new Date()
) {
    return getWatchPartyTimeLeftMs(showtimeStartTime, now) > 0;
}

export function formatWatchPartyTimeLeft(ms: number) {
    if (ms <= 0) {
        return "Booking window closed";
    }

    const totalMinutes = Math.ceil(ms / (60 * 1000));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
        return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }

    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return minutes > 0 ? `${minutes}m` : "<1m";
}
