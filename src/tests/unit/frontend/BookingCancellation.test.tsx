import { describe, it, expect, vi, beforeEach } from "vitest";
import BookingCancellation from "../../../server/emailTemplates/BookingCancellation";
import { renderToStaticMarkup } from "react-dom/server";

describe("BookingCancellation email template", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const props = {
        movieTitle: "Dune",
        posterUrl: "https://example.com/dune.jpg",
        date: "2026-07-01",
        time: "19:00",
        screen: "#1",
        seatLabelList: ["A1", "A2"],
        refundAmount: "20.00",
        bookingId: "#12345",
        refundMethod: "Original payment method",
        refundEta: "5-7 business days",
    };

    it("Renders cancellation details correctly in the email template", () => {
        const emailContent = renderToStaticMarkup(
            <BookingCancellation {...props} />
        );
        expect(emailContent).toContain("Dune");
        expect(emailContent).toContain("2026-07-01");
        expect(emailContent).toContain("19:00");
        expect(emailContent).toContain("A1");
        expect(emailContent).toContain("A2");
        expect(emailContent).toContain("#12345");
    });

    it("Includes the movie poster image in the email template", () => {
        const emailContent = renderToStaticMarkup(
            <BookingCancellation {...props} />
        );
        expect(emailContent).toContain("https://example.com/dune.jpg");
    });

    it("Includes the VOID stamp for cancelled tickets", () => {
        const emailContent = renderToStaticMarkup(
            <BookingCancellation {...props} />
        );
        expect(emailContent).toContain("VOID");
    });

    it("Contains the cancellation confirmation message in the email template", () => {
        const emailContent = renderToStaticMarkup(
            <BookingCancellation {...props} />
        );
        const normalizedContent = emailContent.replace(/&#x27;|&#39;/g, "'");
        expect(normalizedContent).toContain(
            "Your booking has been successfully cancelled. We're sorry to see you go — hopefully we'll catch you at the movies another time!"
        );
    });

    it("Includes refund summary details", () => {
        const emailContent = renderToStaticMarkup(
            <BookingCancellation {...props} />
        );
        expect(emailContent).toContain("Refund Summary");
        expect(emailContent).toContain("Original payment method");
        expect(emailContent).toContain("5-7 business days");
        expect(emailContent).toContain("20.00");
    });
});
