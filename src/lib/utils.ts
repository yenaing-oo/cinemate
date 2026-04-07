import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { env } from "~/env.mjs";

/**
 * Use the cinema timezone for movie and showtime labels so the server and
 * client show the same date and time.
 */
const dateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: env.NEXT_PUBLIC_CINEMA_TIMEZONE,
});

const showtimeDateLabelFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: env.NEXT_PUBLIC_CINEMA_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
});

const showtimeTimeLabelFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: env.NEXT_PUBLIC_CINEMA_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
});

const cadFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CAD",
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatRuntime = (runtime: number) => {
    // Bad or missing runtime values should not break the UI.
    if (!Number.isFinite(runtime) || runtime <= 0) return "Runtime unavailable";
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
};

export const formatRating = (rating: number | null) => {
    if (rating === null || !Number.isFinite(rating)) return "Not rated";
    return `${rating.toFixed(1)} / 10`;
};

export const formatDate = (date: string | Date) =>
    dateFormatter.format(new Date(date));

export const formatShowtimeDate = (date: string | Date) =>
    showtimeDateLabelFormatter.format(new Date(date));

export const formatShowtimeTime = (date: string | Date) =>
    showtimeTimeLabelFormatter.format(new Date(date));

export const formatCad = (amount: number) => cadFormatter.format(amount);

/**
 * Movie metadata is saved as comma-separated text in the database. Split it
 * here before showing it in the UI.
 */
export const formatList = (value: string | null) =>
    value
        ? value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
        : [];

export function formatSeatFromCode(row: number, seat: number): string {
    if (
        !Number.isInteger(row) ||
        row <= 0 ||
        !Number.isInteger(seat) ||
        seat <= 0
    ) {
        throw new Error("Invalid seat: row and seat must be positive integers");
    }

    // Row 1 becomes A, row 2 becomes B, and so on.
    const rowLetter = String.fromCharCode(64 + row);
    return `${rowLetter}${seat}`;
}

/**
 * Formats a duration in milliseconds as M:SS.
 * @param ms Duration in milliseconds
 * @returns Formatted time string
 */
export function formatTime(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatBookingNumber(bookingNumber: number) {
    return `#${bookingNumber.toString().padStart(6, "0")}`;
}
