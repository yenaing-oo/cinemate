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

const PAYMENT_DATETIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
});

export function formatPaymentDateTime(date: Date): string {
    return PAYMENT_DATETIME_FORMATTER.format(date);
}

export function maskCardNumber(cardNumber: string | null | undefined): string {
    if (!cardNumber || cardNumber.length < 4) {
        return "Original payment method";
    }

    return `••••${cardNumber.slice(-4)}`;
}
