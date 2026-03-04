"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { FormField } from "~/components/ui/form-field";
import { Input } from "~/components/ui/input";

export interface ConfirmablePaymentDetails {
    cardholderName: string;
    cardLast4: string;
    expiryMonth: number;
    expiryYear: number;
}

interface PaymentDetailsFormProps {
    onValidPaymentChange: (details: ConfirmablePaymentDetails | null) => void;
}

const ONLY_DIGITS = /\D/g;

function formatCardNumber(value: string) {
    return value
        .replace(ONLY_DIGITS, "")
        .slice(0, 19)
        .replace(/(.{4})/g, "$1 ")
        .trim();
}

function formatExpiry(value: string) {
    const digits = value.replace(ONLY_DIGITS, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function parseExpiry(expiry: string) {
    const [monthText, yearText] = expiry.split("/");
    const month = Number(monthText);
    const year = Number(yearText);
    if (!monthText || !yearText || Number.isNaN(month) || Number.isNaN(year)) {
        return null;
    }
    return { month, year: 2000 + year };
}

export function PaymentDetailsForm({
    onValidPaymentChange,
}: PaymentDetailsFormProps) {
    const [cardholderName, setCardholderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");

    const cardDigits = useMemo(() => cardNumber.replace(ONLY_DIGITS, ""), [cardNumber]);

    const errors = useMemo(() => {
        const nextErrors: Record<string, string> = {};

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
            const now = new Date();
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
        if (cvvDigits.length < 3 || cvvDigits.length > 4) {
            nextErrors.cvv = "Enter a 3 or 4 digit CVV.";
        }

        return nextErrors;
    }, [cardDigits, cardholderName, cvv, expiry]);

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            onValidPaymentChange(null);
            return;
        }
        const parsedExpiry = parseExpiry(expiry);
        if (!parsedExpiry) {
            onValidPaymentChange(null);
            return;
        }
        onValidPaymentChange({
            cardholderName: cardholderName.trim(),
            cardLast4: cardDigits.slice(-4),
            expiryMonth: parsedExpiry.month,
            expiryYear: parsedExpiry.year,
        });
    }, [cardDigits, cardholderName, errors, expiry, onValidPaymentChange]);

    return (
        <div className="glass-card space-y-4 rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-300" />
                <p className="text-sm font-medium">
                    Secure payment details (not stored in session state)
                </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                    id="cardholderName"
                    label="Cardholder Name"
                    error={errors.cardholderName}
                    className="sm:col-span-2"
                >
                    <Input
                        id="cardholderName"
                        autoComplete="cc-name"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="Jane Doe"
                        className="bg-[#0b2340]/60"
                    />
                </FormField>
                <FormField
                    id="cardNumber"
                    label="Card Number"
                    error={errors.cardNumber}
                    className="sm:col-span-2"
                >
                    <Input
                        id="cardNumber"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        value={cardNumber}
                        onChange={(e) =>
                            setCardNumber(formatCardNumber(e.target.value))
                        }
                        placeholder="1234 5678 9012 3456"
                        className="bg-[#0b2340]/60"
                    />
                </FormField>
                <FormField id="expiry" label="Expiry" error={errors.expiry}>
                    <Input
                        id="expiry"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        className="bg-[#0b2340]/60"
                    />
                </FormField>
                <FormField id="cvv" label="CVV" error={errors.cvv}>
                    <Input
                        id="cvv"
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={cvv}
                        onChange={(e) =>
                            setCvv(
                                e.target.value.replace(ONLY_DIGITS, "").slice(0, 4)
                            )
                        }
                        placeholder="123"
                        className="bg-[#0b2340]/60"
                    />
                </FormField>
            </div>
        </div>
    );
}
