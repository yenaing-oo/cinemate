import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatRuntime = (runtime: number) => {
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

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Chicago",
});

export const formatDate = (date: string | Date) =>
    dateFormatter.format(new Date(date));

export const splitList = (value: string | null) =>
    value
        ? value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
        : [];

export function formatShowtime(d: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(d);
}

export function formatSeatFromCode(seatCode: number): string {
    const codeStr = seatCode.toString();

    if (codeStr.length !== 2) {
        return seatCode.toString(); // fallback safety
    }

    const rowNumber = parseInt(codeStr.charAt(0), 10);
    const columnNumber = parseInt(codeStr.charAt(1), 10);

    const rowLetter = String.fromCharCode(64 + rowNumber);
    // 65 = A, so 64 + 1 = 65

    return `${rowLetter}${columnNumber}`;
}
