import { describe, expect, it } from "vitest";
import {
    formatCardNumber,
    formatExpiry,
    getCardBrand,
    getPaymentDetailsErrors,
    parseExpiry,
} from "~/components/checkout/payment-details";

describe("payment-details helpers", () => {
    it("formats card number into 4 digit groups", () => {
        expect(formatCardNumber("4242424242424242")).toBe(
            "4242 4242 4242 4242"
        );
    });

    it("formats expiry into MM/YY", () => {
        expect(formatExpiry("1230")).toBe("12/30");
    });

    it("parses expiry values", () => {
        expect(parseExpiry("04/29")).toEqual({ month: 4, year: 2029 });
    });

    it("detects card brand", () => {
        expect(getCardBrand("4242424242424242")).toBe("Visa");
        expect(getCardBrand("378282246310005")).toBe("American Express");
    });

    it("returns field errors for invalid payment details", () => {
        expect(
            getPaymentDetailsErrors(
                {
                    cardholderName: "A",
                    cardNumber: "4242",
                    expiry: "01/24",
                    cvv: "12",
                },
                new Date("2026-03-06T00:00:00Z")
            )
        ).toEqual({
            cardholderName: "Enter the name on the card.",
            cardNumber: "Enter a valid card number.",
            expiry: "Card is expired.",
            cvv: "Enter a 3 digit CVV.",
        });
    });
});
