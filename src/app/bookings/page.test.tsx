import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import OrderHistoryPage from "./page";

vi.mock("~/env.mjs", () => ({
    env: {
        NODE_ENV: "test",
        NEXT_PUBLIC_BOOKING_CANCEL_WINDOW_MINUTES: "60",
    },
}));

const listResult = {
    data: [] as unknown[] | undefined, // allow undefined for mutation coverage
    isLoading: false,
    error: null,
    refetch: vi.fn(),
};
const cancelResult = {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
};

vi.mock("~/lib/utils", () => ({
    formatShowtimeTime: vi.fn(() => "MOCK_TIME"),
    formatShowtimeDate: vi.fn(() => "MOCK_DATE"),
    formatSeatFromCode: vi.fn(() => "A1"),
    formatBookingNumber: vi.fn((n: number) => `#${n}`),
    formatCad: vi.fn((amt: number) => `$${amt.toFixed(2)}`),
    cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("~/trpc/react", () => ({
    api: {
        bookings: {
            list: { useQuery: () => listResult },
            cancel: { useMutation: () => cancelResult },
        },
    },
}));

//  Mock Card components
vi.mock("~/components/ui/card", () => ({
    Card: ({ children }: any) => <div>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
}));

describe("OrderHistoryPage", () => {
    it("shows a message when there are no bookings (empty array)", () => {
        listResult.data = [];
        render(<OrderHistoryPage />);
        expect(
            screen.getByText(/you've not booked any tickets yet/i)
        ).toBeInTheDocument();
    });

    it("shows a message when there are no bookings (undefined)", () => {
        listResult.data = undefined;
        render(<OrderHistoryPage />);
        expect(
            screen.getByText(/you've not booked any tickets yet/i)
        ).toBeInTheDocument();
    });

    it("renders booking rows when the query returns data", () => {
        listResult.data = [
            {
                id: "1",
                bookingNumber: 123,
                status: "CONFIRMED",
                showtime: {
                    startTime: new Date("2026-02-21T19:30:00"),
                    movie: {
                        title: "Interstellar",
                        posterUrl: "/posters/test.png",
                    },
                },
                tickets: [{ showtimeSeat: { seat: { row: 1, number: 1 } } }],
                totalAmount: "50.00",
            },
        ];
        render(<OrderHistoryPage />);
        expect(screen.getByText(/Interstellar/i)).toBeInTheDocument();

        // Check for the formatted showtime
        expect(screen.getByText(/MOCK_TIME/i)).toBeInTheDocument();

        // Check for the formatted date
        expect(screen.getByText(/MOCK_DATE/i)).toBeInTheDocument();

        // Check for the formatted seat
        expect(screen.getByText(/A1/i)).toBeInTheDocument();

        // Check for the formatted booking number
        expect(screen.getByText(/#123/i)).toBeInTheDocument();

        // Check for the formatted total amount
        expect(screen.getByText(/\$50\.00/i)).toBeInTheDocument();
    });

    it("calls cancel mutation when cancel is confirmed", async () => {
        listResult.data = [
            {
                id: "1",
                bookingNumber: 123,
                status: "CONFIRMED",
                showtime: {
                    startTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
                    movie: {
                        title: "Interstellar",
                        qposterUrl: "/posters/test.png",
                    },
                },
                tickets: [{ showtimeSeat: { seat: { row: 1, number: 1 } } }],
                totalAmount: "50.00",
            },
        ];
        render(<OrderHistoryPage />);
        // Expand the details to show the cancel button
        const details = document.querySelector("details");
        if (details) (details as HTMLDetailsElement).open = true;
        // Click the cancel button
        const cancelBtn = screen.getByRole("button", {
            name: /Cancel Booking/i,
        });
        cancelBtn.click();
        // Confirm dialog should appear, click the confirm button
        const confirmBtn = await screen.findByRole("button", {
            name: /Yes, Cancel/i,
        });
        confirmBtn.click();
        // Wait for the mutation to be called
        await Promise.resolve(); // flush microtasks
        expect(cancelResult.mutateAsync).toHaveBeenCalledWith({
            bookingId: "1",
        });
    });
});
