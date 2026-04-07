const ONE_HOUR_IN_MS = 60 * 60 * 1000;

/**
 * Watch party booking closes one hour before showtime to give the host enough
 * time to finalize the coordinated purchase.
 */
export function getWatchPartyBookingDeadline(showtimeStartTime: Date | string) {
    // Group bookings close early so the host still has time to resolve seat
    // changes before the underlying showtime becomes too close to start.
    return new Date(new Date(showtimeStartTime).getTime() - ONE_HOUR_IN_MS);
}

/**
 * Returns the remaining time before the booking window closes. Negative values
 * mean the party can no longer start a coordinated booking.
 */
export function getWatchPartyTimeLeftMs(
    showtimeStartTime: Date | string,
    now: Date = new Date()
) {
    return (
        getWatchPartyBookingDeadline(showtimeStartTime).getTime() -
        now.getTime()
    );
}

/**
 * Determines whether the host can still start a watch party booking session.
 */
export function isWatchPartyBookable(
    showtimeStartTime: Date | string,
    now: Date = new Date()
) {
    return getWatchPartyTimeLeftMs(showtimeStartTime, now) > 0;
}

/**
 * Formats the remaining time into a short countdown label for the detail view.
 */
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
