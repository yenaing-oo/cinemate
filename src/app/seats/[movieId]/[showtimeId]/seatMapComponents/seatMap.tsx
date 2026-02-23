"use client";

import { Stage, Layer, Rect, Text, Line, Group } from "react-konva";
import { useState, useEffect, useRef } from "react";
import { layoutConfig } from "./seatmapLayoutConfig";
import { calculateScreenLayout, calculateSeatLayout } from "./layoutUtils";

interface SeatMapProps {
    props: {
        selectedSeats: Map<string, string>;
        setSelectedSeats: React.Dispatch<
            React.SetStateAction<Map<string, string>>
        >;
    };
}

const SeatMap = ({ props }: SeatMapProps) => {
    const totalSeatRows = 5;
    const seatPerRow = 6;

    const containerRef = useRef<HTMLDivElement>(null);
    const [stageSize, setStageSize] = useState({
        width: window.outerWidth,
        height: window.outerHeight,
    });

    // Track selected seats: map seatId -> seatNumber for easy lookup
    // const [selectedSeats, setSelectedSeats] = useState<Map<string, string>>(
    //     new Map()
    // );

    const toggleSeat = (row: number, col: number, seatNum: string) => {
        const seatId = `${row}-${col}`;

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
                    height: window.innerHeight * 0.8, // Keep height proportional or fixed
                });
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const seats = calculateSeatLayout(
        stageSize.width,
        stageSize.height,
        totalSeatRows,
        seatPerRow
    );

    return (
        <div ref={containerRef} style={{ overflow: "auto", maxHeight: "80vh" }}>
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
                        const seatNumber = seat.seatNumber;
                        const seatId = `${seat.row}-${seat.col}`;
                        const isSelected = props.selectedSeats.has(seatId);

                        const seatNumberFontSize = seat.size * 0.3;

                        return (
                            <Group
                                key={seatId}
                                width={100}
                                onClick={() =>
                                    toggleSeat(seat.row, seat.col, seatNumber)
                                }
                            >
                                <Rect
                                    key={`${seatId}-seat`}
                                    x={seat.x}
                                    y={seat.y}
                                    width={seat.size}
                                    height={seat.size}
                                    fill={isSelected ? "#4CAF50" : "#3662e3"}
                                    cornerRadius={6}
                                />
                                <Text
                                    key={`${seatId}-text`}
                                    x={seat.x}
                                    y={seat.y}
                                    text={seatNumber}
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
