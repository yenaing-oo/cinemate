"use client";

import { Stage, Layer, Rect, Text, Line, Group } from "react-konva";
import { useState, useEffect, useRef, useMemo } from "react";
import { layoutConfig } from "./seatmapLayoutConfig";
import {
    calculateScreenLayout,
    calculateSeatLayout,
    type SeatPosition,
} from "./layoutUtils";

interface SeatMapProps {
    props: {
        selectedSeats: Map<string, string>;
        setSelectedSeats: React.Dispatch<
            React.SetStateAction<Map<string, string>>
        >;
        selectedTicketCount: number;
        totalSeatRows: number;
        seatPerRow: number;
        seatInfo?: {
            id: string;
            row: number;
            number: number;
            isBooked: boolean;
        }[];
    };
}

const SeatMap = ({ props }: SeatMapProps) => {
    const bookedSeats = new Set<string>(
        props.seatInfo?.filter((s) => s.isBooked).map((s) => s.id)
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const [stageSize, setStageSize] = useState({
        width: 0,
        height: 0,
    });

    const seats = useMemo(() => {
        return calculateSeatLayout(
            stageSize.width,
            stageSize.height,
            props.totalSeatRows,
            props.seatPerRow,
            props.seatInfo
        );
    }, [stageSize, props.totalSeatRows, props.seatPerRow, props.seatInfo]);

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
                if (newMap.size === props.selectedTicketCount) return newMap;
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
                    height: containerRef.current.offsetHeight,
                });
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div ref={containerRef} className="h-screen w-full overflow-hidden">
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
                        preventDefault={false}
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
                            stageSize.height *
                                layoutConfig.screenUI.distanceFromTopPercent -
                            stageSize.width *
                                layoutConfig.screenUI.verticalSpreadPercent -
                            layoutConfig.screenText.verticalDistanceFromScreenUI
                        }
                        fill="white"
                        preventDefault={false}
                    />
                    <Line
                        points={calculateScreenLayout(
                            stageSize.width,
                            stageSize.height
                        ).flatMap((p) => [p.x, p.y])}
                        stroke="white"
                        strokeWidth={10}
                        tension={0.5} // makes it smooth
                        closed={false} // open arc
                        preventDefault={false}
                    />
                    {/* Seats */}
                    {seats.map((seat) => {
                        const seatData = props.seatInfo?.find(
                            (s) => s.id === seat.seatId
                        );
                        const seatLable = seat.seatLable;
                        const seatId = seatData
                            ? seatData.id
                            : `${seat.row}-${seat.col}`;
                        const isSelected = props.selectedSeats.has(seatId);
                        const isBooked = !!seatData?.isBooked;

                        const seatNumberFontSize = seat.size * 0.3;

                        return (
                            <Group
                                key={seatId}
                                width={100}
                                onClick={() =>
                                    !isBooked && toggleSeat(seatId, seatLable)
                                }
                                onTouchEnd={() => {
                                    !isBooked && toggleSeat(seatId, seatLable);
                                }}
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
