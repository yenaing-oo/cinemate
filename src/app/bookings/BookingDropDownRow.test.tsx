import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BookingDropDownRow } from "./BookingDropDownRow";
import type { BookingStatus } from "@prisma/client";

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
        formatShowtimeDate: vi.fn(() => "MOCK_DATE"),
        formatSeatFromCode: vi.fn(() => "A1"),
        formatBookingNumber: vi.fn((num: number) => `#${num}`),
        formatCad: vi.fn((amount: number) => `$${amount.toFixed(2)}`),
    };
});
describe("BookingDropDownRow render tests", () => {
    const renderComponent = () =>
        render(
            <BookingDropDownRow
                booking={{
                    id: "1",
                    bookingNumber: 12345,
                    status: "CONFIRMED" as BookingStatus,
                    showtime: {
                        startTime: new Date("2026-02-21T19:30:00"),
                        movie: {
                            posterUrl: "/posters/test.png",
                            title: "Interstellar",
                        },
                    },
                    tickets: [
                        {
                            showtimeSeat: {
                                seat: { row: 1, number: 1 },
                            },
                        },
                    ],
                    totalAmount: 50,
                }}
            />
        );

    it("renders the poster image", () => {
        renderComponent();

        const img = screen.getByRole("img", { name: "Interstellar" });
        expect(img).toHaveAttribute("data-src", "/posters/test.png");
    });

    it("renders the movie title", () => {
        renderComponent();

        expect(screen.getAllByText("Interstellar")).toHaveLength(1);
    });

    it("renders the formatted seats", () => {
        renderComponent();

        expect(screen.getByText("A1")).toBeInTheDocument();
    });
});