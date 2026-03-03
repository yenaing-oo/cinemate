import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BookingDropDownRow, isBookingCancellable } from "./BookingDropDownRow";
import type { BookingStatus } from "@prisma/client";
import type { Booking as ComponentBooking } from "./BookingDropDownRow";

(globalThis as any).env = (globalThis as any).env || {};
(globalThis as any).env.NEXT_PUBLIC_BOOKING_CANCEL_WINDOW_MINUTES = 60; 

//Mocking Next.js components and utilities
vi.mock("next/image", () => ({
    __esModule: true,
    default: ({ alt = "", src }: any) => (
        <div
            role="img"
            aria-label={alt}
            data-src={typeof src === "string" ? src : src?.src}
        />
    ),
}));

//  Mock Card components
vi.mock("~/components/ui/card", () => ({
    Card: ({ children }: any) => <div>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
}));

//  Partial mock of utils
vi.mock("~/lib/utils", () => {
    return {
        formatShowtimeTime: vi.fn(() => "2:30 PM"),
        formatShowtimeDate: vi.fn(() => "26 March, 2026"),
        formatSeatFromCode: vi.fn(() => "C5"),
        formatBookingNumber: vi.fn((num: number) => `#${num}`),
        formatCad: vi.fn((amount: number) => `$${amount.toFixed(2)}`),
    };
});

vi.mock("~/components/ui/button", () => ({
    __esModule: true,
    Button: ({ children, ...props }: any) => (
        <button type="button" {...props}>
            {children}
        </button>
    ),
}));

//Test cases for BookingDropDownRow component
describe("BookingDropDownRow render tests", () => {
    const renderComponent = () =>
        render(
            <BookingDropDownRow
                booking={{
                    id: "1",
                    bookingNumber: 12345,
                    status: "CONFIRMED" as BookingStatus,
                    showtime: {
                        startTime: new Date("2026-03-26T19:30:00"),
                        movie: {
                            posterUrl: "/posters/test.png",
                            title: "Interstellar",
                        },
                    },
                    tickets: [
                        {
                            showtimeSeat: {
                                seat: { row: 3, number: 5 },
                            },
                        },
                    ],
                    totalAmount: 50,
                }}
            />
        );

    //  Test that the component renders the correct movie poster, title, time and date
    it("renders the correct bookings' poster, title, time and date", () => {
        renderComponent();

        const img = screen.getByRole("img", { name: "Interstellar" });
        expect(img).toHaveAttribute("data-src", "/posters/test.png");
        expect(screen.getAllByText("Interstellar")).toHaveLength(1);
        expect(
            screen.getByText("26 March, 2026 @ 2:30 PM")
        ).toBeInTheDocument();
    });

    //  Test that the component renders the correct booking number, amount and seats
    it("renders the correct booking details: seats, amount and booking number", () => {
        renderComponent();

        expect(screen.getByText("Booking #12345")).toBeInTheDocument();
        expect(screen.getByText("$50.00")).toBeInTheDocument();
        expect(screen.getByText("C5")).toBeInTheDocument();
    });

    //  Test that the cancel button is rendered only if the booking is cancellable
    it("renders if the booking is cancellable", () => {
        renderComponent();

        const details = document.querySelector("details");
        expect(details).not.toBeNull();

        (details as HTMLDetailsElement).open = true;

        expect(
            screen.getByRole("button", { name: /Cancel Booking/i })
        ).toBeInTheDocument();
    });

    //  Test that the cancel button is not rendered if the booking is not cancellable
    it("does not render cancel button if the booking is not cancellable", () => {
        render(
            <BookingDropDownRow
                booking={{
                    id: "2",
                    bookingNumber: 12346,
                    status: "COMPLETED" as BookingStatus,
                    showtime: {
                        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
                        movie: {
                            posterUrl: "/posters/test2.png",
                            title: "Inception",
                        },
                    },
                    tickets: [
                        {
                            showtimeSeat: {
                                seat: { row: 2, number: 2 },
                            },
                        },
                    ],
                    totalAmount: 75,
                }}
            />
        );

        const details = document.querySelector("details");
        expect(details).not.toBeNull();

        (details as HTMLDetailsElement).open = true;

        expect(
            screen.queryByRole("button", { name: /Cancel Booking/i })
        ).not.toBeInTheDocument();
    });
});

//Test cases for isBookingCancellable function
describe("isBookingCancellable", () => {
    //  Test that a booking is cancellable if it is confirmed and the showtime is more than the cancel window away
    it("returns true for a confirmed booking with showtime more than cancel window away", () => {
        const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours from now
        const booking: ComponentBooking = {
            id: "1",
            bookingNumber: 12345,
            status: "CONFIRMED",
            showtime: {
                startTime: futureDate,
                movie: { title: "Test Movie" },
            },
            tickets: [],
            totalAmount: 0 as any,
        };
        expect(isBookingCancellable(booking)).toBe(true);
    });

    //  Test that a booking is not cancellable if the showtime is within the cancel window
    it("returns false for a confirmed booking with showtime within cancel window", () => {
        const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        const booking: ComponentBooking = {
            id: "2",
            bookingNumber: 12346,
            status: "CONFIRMED",
            showtime: {
                startTime: futureDate,
                movie: { title: "Test Movie" },
            },
            tickets: [],
            totalAmount: 0 as any,
        };
        expect(isBookingCancellable(booking)).toBe(false);
    });
});
