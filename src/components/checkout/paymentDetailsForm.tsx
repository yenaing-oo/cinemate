"use client";

// Collects and validates new card details before checkout can continue.
import { useEffect, useMemo, useState } from "react";
import { FormField } from "~/components/ui/form-field";
import { Input } from "~/components/ui/input";
import {
    formatCardNumber,
    formatExpiry,
    getCardBrand,
    getPaymentDetailsErrors,
    ONLY_DIGITS,
    parseExpiry,
    type NewCardPaymentDetails,
} from "~/components/checkout/paymentDetails";

interface PaymentDetailsFormProps {
    onValidPaymentChange: (details: NewCardPaymentDetails | null) => void;
}

export function PaymentDetailsForm({
    onValidPaymentChange,
}: PaymentDetailsFormProps) {
    const [cardholderName, setCardholderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [touchedFields, setTouchedFields] = useState<
        Partial<
            Record<"cardholderName" | "cardNumber" | "expiry" | "cvv", boolean>
        >
    >({});

    const cardDigits = useMemo(
        () => cardNumber.replace(ONLY_DIGITS, ""),
        [cardNumber]
    );
    const cardBrand = useMemo(() => getCardBrand(cardDigits), [cardDigits]);

    const errors = useMemo(() => {
        return getPaymentDetailsErrors({
            cardholderName,
            cardNumber,
            expiry,
            cvv,
        });
    }, [cardNumber, cardholderName, cvv, expiry]);

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
            source: "new",
            cardholderName: cardholderName.trim(),
            cardNumber: cardDigits,
            cardLast4: cardDigits.slice(-4),
            expiryMonth: parsedExpiry.month,
            expiryYear: parsedExpiry.year,
            cardBrand,
        });
    }, [
        cardBrand,
        cardDigits,
        cardholderName,
        errors,
        expiry,
        onValidPaymentChange,
    ]);

    const showError = (
        field: "cardholderName" | "cardNumber" | "expiry" | "cvv"
    ) => (touchedFields[field] ? errors[field] : undefined);

    const markTouched = (
        field: "cardholderName" | "cardNumber" | "expiry" | "cvv"
    ) => {
        setTouchedFields((current) =>
            current[field] ? current : { ...current, [field]: true }
        );
    };

    return (
        <div className="space-y-4">
            <div className="glass-card space-y-4 rounded-2xl border border-white/10 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                        id="cardholderName"
                        label="Cardholder Name"
                        error={showError("cardholderName")}
                        className="sm:col-span-2"
                    >
                        <Input
                            id="cardholderName"
                            autoComplete="cc-name"
                            value={cardholderName}
                            onChange={(e) => {
                                setCardholderName(e.target.value);
                                markTouched("cardholderName");
                            }}
                            onBlur={() => markTouched("cardholderName")}
                            aria-invalid={Boolean(showError("cardholderName"))}
                            className="bg-[#0b2340]/60"
                        />
                    </FormField>
                    <FormField
                        id="cardNumber"
                        label="Card Number"
                        description={`${cardBrand} accepted`}
                        error={showError("cardNumber")}
                        className="sm:col-span-2"
                    >
                        <Input
                            id="cardNumber"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            value={cardNumber}
                            maxLength={23}
                            onChange={(e) => {
                                setCardNumber(formatCardNumber(e.target.value));
                                markTouched("cardNumber");
                            }}
                            onBlur={() => markTouched("cardNumber")}
                            aria-invalid={Boolean(showError("cardNumber"))}
                            className="bg-[#0b2340]/60"
                        />
                    </FormField>
                    <FormField
                        id="expiry"
                        label="Expiry"
                        error={showError("expiry")}
                    >
                        <Input
                            id="expiry"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            value={expiry}
                            maxLength={5}
                            onChange={(e) => {
                                setExpiry(formatExpiry(e.target.value));
                                markTouched("expiry");
                            }}
                            onBlur={() => markTouched("expiry")}
                            placeholder="MM/YY"
                            aria-invalid={Boolean(showError("expiry"))}
                            className="bg-[#0b2340]/60"
                        />
                    </FormField>
                    <FormField
                        id="cvv"
                        label="CVV"
                        description={
                            cardBrand === "American Express"
                                ? "4 digit security code"
                                : "3 digit security code"
                        }
                        error={showError("cvv")}
                    >
                        <Input
                            id="cvv"
                            type="password"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            value={cvv}
                            maxLength={cardBrand === "American Express" ? 4 : 3}
                            onChange={(e) => {
                                setCvv(
                                    e.target.value
                                        .replace(ONLY_DIGITS, "")
                                        .slice(
                                            0,
                                            cardBrand === "American Express"
                                                ? 4
                                                : 3
                                        )
                                );
                                markTouched("cvv");
                            }}
                            onBlur={() => markTouched("cvv")}
                            aria-invalid={Boolean(showError("cvv"))}
                            className="bg-[#0b2340]/60"
                        />
                    </FormField>
                </div>
            </div>
        </div>
    );
}
