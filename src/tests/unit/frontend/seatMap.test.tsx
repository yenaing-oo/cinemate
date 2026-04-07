import React, { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SeatMap from "~/app/ticketing/childRoutes/seatSelection/seatMapComponents/seatMap";

vi.mock("react-konva", () => {
    const MockNode = ({ children }: { children?: React.ReactNode }) => (
        <div>{children}</div>
    );

    return {
        Stage: MockNode,
        Layer: MockNode,
        Rect: MockNode,
        Text: MockNode,
        Line: MockNode,
        Group: MockNode,
        Circle: MockNode,
        Ellipse: MockNode,
        Path: MockNode,
    };
});

function SeatMapHarness({
    seatInfo,
    seatInfoReady,
}: {
    seatInfo: { id: string; row: number; number: number; isBooked: boolean }[];
    seatInfoReady: boolean;
}) {
    const [selectedSeats, setSelectedSeats] = useState<Map<string, string>>(
        new Map()
    );

    return (
        <>
            <SeatMap
                props={{
                    selectedSeats,
                    setSelectedSeats,
                    selectedTicketCount: 1,
                    totalSeatRows: 1,
                    seatPerRow: 3,
                    seatInfo,
                    seatInfoReady,
                }}
            />
            <p data-testid="selected-seats">
                {Array.from(selectedSeats.values()).join(", ") || "none"}
            </p>
        </>
    );
}

describe("SeatMap", () => {
    it("waits for fresh seat data before auto-selecting a suggested seat", async () => {
        Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
            configurable: true,
            get: () => 960,
        });
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
            configurable: true,
            get: () => 720,
        });

        const cachedSeatInfo = [
            { id: "seat-a1", row: 1, number: 1, isBooked: false },
            { id: "seat-a2", row: 1, number: 2, isBooked: false },
            { id: "seat-a3", row: 1, number: 3, isBooked: false },
        ];
        const freshSeatInfo = [
            { id: "seat-a1", row: 1, number: 1, isBooked: true },
            { id: "seat-a2", row: 1, number: 2, isBooked: false },
            { id: "seat-a3", row: 1, number: 3, isBooked: false },
        ];

        const { rerender } = render(
            <SeatMapHarness seatInfo={cachedSeatInfo} seatInfoReady={false} />
        );

        await waitFor(() => {
            expect(screen.getByTestId("selected-seats")).toHaveTextContent(
                "none"
            );
        });

        rerender(
            <SeatMapHarness seatInfo={freshSeatInfo} seatInfoReady={true} />
        );

        await waitFor(() => {
            expect(screen.getByTestId("selected-seats")).toHaveTextContent(
                "A2"
            );
        });
    });
});
