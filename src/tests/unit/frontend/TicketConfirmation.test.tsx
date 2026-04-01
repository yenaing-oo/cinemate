import { describe, it, expect, vi, beforeEach } from "vitest";
import TicketConfirmation from "../../../server/emailTemplates/TicketConfirmation";
import { renderToStaticMarkup } from "react-dom/server";

describe("TicketConfirmation email template", () => {
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
        totalPrice: "20.00",
        bookingId: "#12345",
    };

    it("Renders booking details correctly in the email template", () => {
        const emailContent = renderToStaticMarkup(
            <TicketConfirmation {...props} />
        );
        expect(emailContent).toContain("Dune");
        expect(emailContent).toContain("2026-07-01");
        expect(emailContent).toContain("19:00");
        expect(emailContent).toContain("A1");
        expect(emailContent).toContain("A2");
        expect(emailContent).toContain("20.00");
        expect(emailContent).toContain("#12345");
    });

    it("Includes the movie poster image in the email template", () => {
        const emailContent = renderToStaticMarkup(
            <TicketConfirmation {...props} />
        );
        expect(emailContent).toContain("https://example.com/dune.jpg");
    });

    it("Includes a QR code image in the email template", () => {
        const emailContent = renderToStaticMarkup(
            <TicketConfirmation {...props} />
        );
        expect(emailContent).toContain(
            "https://www.davidleonard.london/wp-content/uploads/2024/05/FI-QRcode-of-URL.png"
        );
    });

    it("Contains the payment confirmation message in the email template", () => {
        const emailContent = renderToStaticMarkup(
            <TicketConfirmation {...props} />
        );
        const normalizedContent = emailContent.replace(/&#x27;|&#39;/g, "'");
        expect(normalizedContent).toContain(
            "You're all set for the movies! Your booking is confirmed. Keep this email handy to scan at the entrance."
        );
    });

    it("Contains the payment summary details in the email template", () => {
        const emailContent = renderToStaticMarkup(
            <TicketConfirmation {...props} />
        );
        expect(emailContent).toContain("Payment Summary");
        expect(emailContent).toContain("Total Paid");
        expect(emailContent).toContain("20.00");
        expect(emailContent).toContain("Booking ID");
        expect(emailContent).toContain("#12345");
    });

    it("renders a ticket card for each seat label with correct seat text", () => {
        const emailContent = renderToStaticMarkup(
            <TicketConfirmation {...props} />
        );
        props.seatLabelList.forEach((seatLabel) => {
            // Check that the ticket card section for this seat exists
            expect(emailContent).toContain(`Seat: ${seatLabel}`);
            // Optionally, check the movie title and date/time are present for each ticket
            expect(emailContent).toContain(props.movieTitle);
            expect(emailContent).toContain(props.date);
            expect(emailContent).toContain(props.time);
        });
    });
});
