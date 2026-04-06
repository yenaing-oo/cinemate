"use client";

export interface NewCardPaymentDetails {
    source: "new";
    cardholderName: string;
    cardNumber: string;
    cardLast4: string;
    expiryMonth: number;
    expiryYear: number;
    cardBrand: string;
}

export interface SavedCardPaymentDetails {
    source: "saved";
    cardLast4: string;
    cardBrand: string;
}

export type ConfirmablePaymentDetails =
    | NewCardPaymentDetails
    | SavedCardPaymentDetails;

export interface PaymentDetailsInput {
    cardholderName: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
}

export const ONLY_DIGITS = /\D/g;

const CARD_BRAND_PATTERNS = [
    { brand: "Visa", pattern: /^4\d{0,18}$/ },
    {
        brand: "Mastercard",
        pattern:
            /^(5[1-5]\d{0,14}|2(?:2[2-9]|[3-6]\d|7[01])\d{0,12}|2720\d{0,12})$/,
    },
    { brand: "American Express", pattern: /^3[47]\d{0,13}$/ },
    {
        brand: "Discover",
        pattern: /^(6011\d{0,12}|65\d{0,14}|64[4-9]\d{0,13})$/,
    },
];

export function formatCardNumber(value: string) {
    return value
        .replace(ONLY_DIGITS, "")
        .slice(0, 19)
        .replace(/(.{4})/g, "$1 ")
        .trim();
}

export function formatExpiry(value: string) {
    const digits = value.replace(ONLY_DIGITS, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function parseExpiry(expiry: string) {
    const [monthText, yearText] = expiry.split("/");
    const month = Number(monthText);
    const year = Number(yearText);
    if (!monthText || !yearText || Number.isNaN(month) || Number.isNaN(year)) {
        return null;
    }
    return { month, year: 2000 + year };
}

export function getCardBrand(cardDigits: string) {
    const matchingBrand = CARD_BRAND_PATTERNS.find(({ pattern }) =>
        pattern.test(cardDigits)
    );
    return matchingBrand?.brand ?? "Card";
}

export function getPaymentDetailsErrors(
    { cardholderName, cardNumber, expiry, cvv }: PaymentDetailsInput,
    now = new Date()
) {
    const nextErrors: Record<string, string> = {};
    const cardDigits = cardNumber.replace(ONLY_DIGITS, "");

    if (cardholderName.trim().length < 2) {
        nextErrors.cardholderName = "Enter the name on the card.";
    }

    if (cardDigits.length < 13 || cardDigits.length > 19) {
        nextErrors.cardNumber = "Enter a valid card number.";
    }

    const parsedExpiry = parseExpiry(expiry);
    if (!parsedExpiry || parsedExpiry.month < 1 || parsedExpiry.month > 12) {
        nextErrors.expiry = "Use MM/YY format.";
    } else {
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const isExpired =
            parsedExpiry.year < currentYear ||
            (parsedExpiry.year === currentYear &&
                parsedExpiry.month < currentMonth);
        if (isExpired) {
            nextErrors.expiry = "Card is expired.";
        }
    }

    const cvvDigits = cvv.replace(ONLY_DIGITS, "");
    const cardBrand = getCardBrand(cardDigits);
    const expectedCvvLength = cardBrand === "American Express" ? 4 : 3;

    if (cvvDigits.length !== expectedCvvLength) {
        nextErrors.cvv =
            expectedCvvLength === 4
                ? "American Express uses a 4 digit CVV."
                : "Enter a 3 digit CVV.";
    }

    return nextErrors;
}
