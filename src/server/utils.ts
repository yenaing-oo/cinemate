export function isShowtimeSeatAvailable(
    s: {
        isBooked: boolean;
        heldTill: Date | null;
        heldByUserId: string | null;
    },
    userId: string,
    now: Date = new Date()
): boolean {
    if (s.isBooked) return false;
    if (
        s.heldTill === null || // not held
        s.heldTill < now || // hold expired
        s.heldByUserId === userId // held by current user
    ) {
        return true;
    }
    return false;
}
