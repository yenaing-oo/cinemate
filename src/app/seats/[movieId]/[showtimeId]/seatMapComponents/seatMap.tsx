"use client";

import { Stage, Layer, Rect, Text, Line, Group } from "react-konva";
import { useState, useEffect, useRef } from "react";
import { layoutConfig } from "./seatmapLayoutConfig";
import {
    calculateScreenLayout,
    calculateSeatLayout,
    type SeatPosition,
} from "./layoutUtils";
import { $Enums } from "@prisma/client";

interface SeatMapProps {
    props: {
        selectedSeats: Map<string, string>;
        setSelectedSeats: React.Dispatch<
            React.SetStateAction<Map<string, string>>
        >;
        selectedTicketCount: number;
        totalSeatRows: number;
        seatPerRow: number;
        seatInfo: {
            seatId: string;
            row: number;
            number: number;
            status: $Enums.SeatStatus;
        }[];
    };
}

const SeatMap = ({ props }: SeatMapProps) => {
    const bookedSeats = new Set<string>(
        props.seatInfo
            .filter((s) => s.status === $Enums.SeatStatus.BOOKED)
            .map((s) => s.seatId)
    );

    bookedSeats.add("cmm1kp11w0008ttywcz84v3wx"); //1-9
    bookedSeats.add("cmm1kp11w000bttywnlc7kct8"); //1-13
    // reservedSeats.add("1-0");
    // reservedSeats.add("2-0");
    // reservedSeats.add("3-0");
    // reservedSeats.add("4-0");
    // reservedSeats.add("1-2");
    // reservedSeats.add("2-5");
    // reservedSeats.add("3-1");
    // reservedSeats.add("4-5");

    const containerRef = useRef<HTMLDivElement>(null);
    const [stageSize, setStageSize] = useState({
        width: window.outerWidth,
        height: window.outerHeight,
    });

    const seats = calculateSeatLayout(
        stageSize.width,
        stageSize.height,
        props.totalSeatRows,
        props.seatPerRow,
        props.seatInfo
    );

    // Preselect seats on mount or when selectedTicketCount changes
    useEffect(() => {
        const findConnectedSeats = (rowSeats: SeatPosition[]) => {
            let selectedSeats: [string, string][] = [];

            if (props.selectedTicketCount === 1 && rowSeats[0]) {
                selectedSeats.push([rowSeats[0].seatId, rowSeats[0].seatLable]);
                return selectedSeats;
            }

            let requiredSeatsFound = false;
            let seatGap = false;
            let matchPossible = true;

            for (
                let r = 1;
                r < rowSeats.length && !requiredSeatsFound && matchPossible;
                r++
            ) {
                const currSeatColumn = rowSeats[r];
                const prevSeatColumn = rowSeats[r - 1];

                if (!currSeatColumn || !prevSeatColumn) continue;

                seatGap =
                    currSeatColumn?.col !== undefined &&
                    prevSeatColumn?.col !== undefined &&
                    currSeatColumn.col - 1 !== prevSeatColumn.col;

                if (!seatGap) {
                    if (selectedSeats.length === 0) {
                        selectedSeats.push(
                            [prevSeatColumn.seatId, prevSeatColumn.seatLable],
                            [currSeatColumn.seatId, currSeatColumn.seatLable]
                        );
                    } else {
                        selectedSeats.push([
                            currSeatColumn.seatId,
                            currSeatColumn.seatLable,
                        ]);
                    }

                    requiredSeatsFound =
                        selectedSeats.length === props.selectedTicketCount;
                } else {
                    selectedSeats.splice(0, selectedSeats.length);

                    const remainingSeats = rowSeats.slice(r);
                    matchPossible =
                        remainingSeats.length >= props.selectedTicketCount;
                }
            }

            return selectedSeats;
        };

        // Only preselect if nothing is already selected
        if (props.selectedSeats.size === 0 && props.selectedTicketCount > 0) {
            // Find seats in same row
            let found = false;
            let selected: [string, string][] = [];
            for (let r = 1; r <= props.totalSeatRows && !found; r++) {
                const rowSeats = seats.filter(
                    (seat) => seat.row === r && !bookedSeats.has(seat.seatId)
                );
                if (rowSeats.length >= props.selectedTicketCount) {
                    selected = findConnectedSeats(rowSeats);
                    found = selected.length > 0;
                }
            }
            // If not found in one row, pick first available seats
            if (!found) {
                const availableSeats = seats.filter(
                    (seat) => !bookedSeats.has(seat.seatId)
                );
                selected = availableSeats
                    .slice(0, props.selectedTicketCount)
                    .map((seat) => [seat.seatId, seat.seatLable]);
            }
            props.setSelectedSeats(new Map(selected));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleSeat = (seatId: string, seatNum: string) => {
        if (bookedSeats.has(seatId)) return;
        props.setSelectedSeats((prev) => {
            const newMap = new Map(prev);
            if (newMap.has(seatId)) {
                newMap.delete(seatId);
            } else {
                newMap.set(seatId, seatNum);
            }
            return newMap;
        });
    };

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setStageSize({
                    width: containerRef.current.offsetWidth,
                    height: window.outerHeight, // Keep height proportional or fixed
                });
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div
            ref={containerRef}
            className="max-h-[80vh] overflow-hidden md:max-h-screen"
        >
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                draggable={false}
            >
                <Layer>
                    <Rect
                        ref={null}
                        width={stageSize.width}
                        height={stageSize.height}
                        fill={"#03051a"}
                    />
                    <Text
                        text="Screen"
                        fontSize={layoutConfig.screenText.fontsize}
                        width={layoutConfig.screenText.width}
                        align="center"
                        x={
                            stageSize.width / 2 -
                            layoutConfig.screenText.width / 2
                        }
                        y={
                            layoutConfig.screenUI.distanceFromTop -
                            stageSize.width *
                                layoutConfig.screenUI.verticalSpreadPercent -
                            layoutConfig.screenText.verticalDistanceFromScreenUI
                        }
                        fill="white"
                    />
                    <Line
                        points={calculateScreenLayout(stageSize.width).flatMap(
                            (p) => [p.x, p.y]
                        )}
                        stroke="white"
                        strokeWidth={10}
                        tension={0.5} // makes it smooth
                        closed={false} // open arc
                    />
                    {/* Seats */}
                    {seats.map((seat) => {
                        const seatData = props.seatInfo.find(
                            (s) => s.seatId === seat.seatId
                        );
                        const seatLable = seat.seatLable;
                        const seatStatus = seatData
                            ? seatData.status
                            : $Enums.SeatStatus.AVAILABLE;
                        const seatId = seatData
                            ? seatData.seatId
                            : `${seat.row}-${seat.col}`;
                        const isSelected = props.selectedSeats.has(seatId);
                        // const isBooked =
                        //     seatStatus === $Enums.SeatStatus.BOOKED;     // TODO: this should work now after fixing pre-selection. If doesnt, then remove seatStatus!
                        const isBooked = bookedSeats.has(seatId);

                        const seatNumberFontSize = seat.size * 0.3;

                        return (
                            <Group
                                key={seatId}
                                width={100}
                                onClick={() =>
                                    !isBooked && toggleSeat(seatId, seatLable)
                                }
                            >
                                <Rect
                                    key={`${seatId}-seat`}
                                    x={seat.x}
                                    y={seat.y}
                                    width={seat.size}
                                    height={seat.size}
                                    fill={
                                        isSelected
                                            ? "#4CAF50"
                                            : isBooked
                                              ? "#565656"
                                              : "#3662e3"
                                    }
                                    cornerRadius={6}
                                />
                                <Text
                                    key={`${seatId}-text`}
                                    x={seat.x}
                                    y={seat.y}
                                    text={seatLable}
                                    fontFamily="Calibri"
                                    fontSize={seatNumberFontSize}
                                    textFill="white"
                                    fill="white"
                                    alpha={0.75}
                                    width={seat.size}
                                    height={seat.size}
                                    align="center"
                                    verticalAlign="middle"
                                />
                            </Group>
                        );
                    })}
                </Layer>
            </Stage>
        </div>
    );
};

export default SeatMap;
