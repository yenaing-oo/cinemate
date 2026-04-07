"use client";

import {
    Stage,
    Layer,
    Rect,
    Text,
    Line,
    Group,
    Circle,
    Ellipse,
    Path,
} from "react-konva";
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
        seatInfoReady: boolean;
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

const SEAT_SHAPE_PATH =
    "M85.93,31.74c-2.55,0-4.61,2.06-4.61,4.61v31.53c-.28.1-.57.18-.85.31-.08.04-4.41,2.11-11.41,4.05-2.23-1.56-5.05-2.26-7.93-1.7-10.58,2.05-20.85,2.08-31.41.07-2.85-.54-5.65.15-7.86,1.68-6.97-1.93-11.29-4.01-11.41-4.08-.26-.13-.53-.21-.79-.3v-31.57c0-2.55-2.07-4.61-4.61-4.61S.43,33.81.43,36.35v37.68c0,.22.03.43.06.64.1,2.45,1.46,4.77,3.8,5.94.4.2,5.78,2.83,14.37,5.16,1.44,2.63,4,4.63,7.17,5.23,6.5,1.24,13.02,1.86,19.39,1.86s13.2-.65,19.85-1.94c3.14-.61,5.68-2.57,7.11-5.17,8.57-2.32,13.97-4.93,14.37-5.13,2.19-1.07,3.54-3.15,3.81-5.4.1-.39.18-.78.18-1.2v-37.68c0-2.55-2.07-4.61-4.62-4.61ZM16.22,34.05v29.09c.92.36,2.03.77,3.37,1.21,3.58-1.81,7.76-2.43,11.76-1.67,9.63,1.84,18.69,1.81,28.36-.06,4.04-.78,8.21-.17,11.79,1.64,1.23-.41,2.27-.79,3.15-1.13l.02-29.08c0-5.2,3.85-9.48,8.84-10.23v-14.07c0-2.55-1.93-3.75-4.61-4.61,0,0-14.63-4.23-33.17-4.23S11.99,5.14,11.99,5.14c-2.62.81-4.61,2.07-4.61,4.61v14.07c4.99.75,8.84,5.03,8.84,10.23Z";
const SEAT_SHAPE_WIDTH = 91.25;
const SEAT_SHAPE_HEIGHT = 93.66;

const SeatMap = ({ props }: SeatMapProps) => {
    const hasAutoSuggestedRef = useRef(false);
    const {
        selectedSeats,
        setSelectedSeats,
        seatInfoReady,
        selectedTicketCount,
        totalSeatRows,
        seatPerRow,
        seatInfo,
    } = props;
    const bookedSeats = useMemo(
        () =>
            new Set<string>(
                seatInfo?.filter((seat) => seat.isBooked).map((seat) => seat.id)
            ),
        [seatInfo]
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const [stageSize, setStageSize] = useState({
        width: 0,
        height: 0,
    });

    const seats = useMemo(
        () =>
            calculateSeatLayout(
                stageSize.width,
                stageSize.height,
                totalSeatRows,
                seatPerRow,
                seatInfo
            ),
        [stageSize.width, stageSize.height, totalSeatRows, seatPerRow, seatInfo]
    );

    const seatInfoById = useMemo(
        () => new Map(seatInfo?.map((seat) => [seat.id, seat]) ?? []),
        [seatInfo]
    );

    const screenCurve = useMemo(
        () => calculateScreenLayout(stageSize.width, stageSize.height),
        [stageSize.width, stageSize.height]
    );

    const screenMetrics = useMemo(() => {
        const centerX = stageSize.width / 2;

        if (screenCurve.length === 0) {
            return {
                centerX,
                minY: 0,
                maxY: 0,
                minX: 0,
                maxX: 0,
                points: [] as number[],
            };
        }

        return {
            centerX,
            minY: Math.min(...screenCurve.map((point) => point.y)),
            maxY: Math.max(...screenCurve.map((point) => point.y)),
            minX: Math.min(...screenCurve.map((point) => point.x)),
            maxX: Math.max(...screenCurve.map((point) => point.x)),
            points: screenCurve.flatMap((point) => [point.x, point.y]),
        };
    }, [screenCurve, stageSize.width]);

    const seatBounds = useMemo(() => {
        if (seats.length === 0) {
            return null;
        }

        return seats.reduce(
            (bounds, seat) => ({
                minX: Math.min(bounds.minX, seat.x),
                maxX: Math.max(bounds.maxX, seat.x + seat.size),
                minY: Math.min(bounds.minY, seat.y),
                maxY: Math.max(bounds.maxY, seat.y + seat.size),
                seatSize: seat.size,
            }),
            {
                minX: Number.POSITIVE_INFINITY,
                maxX: Number.NEGATIVE_INFINITY,
                minY: Number.POSITIVE_INFINITY,
                maxY: Number.NEGATIVE_INFINITY,
                seatSize: seats[0]?.size ?? 0,
            }
        );
    }, [seats]);

    const rowLabels = useMemo(
        () =>
            Array.from({ length: totalSeatRows }, (_, index) => {
                const row = index + 1;
                const rowSeats = seats.filter((seat) => seat.row === row);

                if (rowSeats.length === 0) {
                    return null;
                }

                const centerY =
                    rowSeats.reduce(
                        (sum, seat) => sum + seat.y + seat.size / 2,
                        0
                    ) / rowSeats.length;

                return {
                    row,
                    label: String.fromCharCode(64 + row),
                    y: centerY,
                };
            }).filter(
                (
                    rowLabel
                ): rowLabel is {
                    row: number;
                    label: string;
                    y: number;
                } => rowLabel !== null
            ),
        [totalSeatRows, seats]
    );

    useEffect(() => {
        const findConnectedSeats = (rowSeats: SeatPosition[]) => {
            const selected: [string, string][] = [];

            if (selectedTicketCount === 1 && rowSeats[0]) {
                selected.push([rowSeats[0].seatId, rowSeats[0].seatLable]);
                return selected;
            }

            let requiredSeatsFound = false;
            let seatGap = false;
            let matchPossible = true;

            for (
                let index = 1;
                index < rowSeats.length && !requiredSeatsFound && matchPossible;
                index++
            ) {
                const currentSeat = rowSeats[index];
                const previousSeat = rowSeats[index - 1];

                if (!currentSeat || !previousSeat) continue;

                seatGap =
                    currentSeat.col !== undefined &&
                    previousSeat.col !== undefined &&
                    currentSeat.col - 1 !== previousSeat.col;

                if (!seatGap) {
                    if (selected.length === 0) {
                        selected.push(
                            [previousSeat.seatId, previousSeat.seatLable],
                            [currentSeat.seatId, currentSeat.seatLable]
                        );
                    } else {
                        selected.push([
                            currentSeat.seatId,
                            currentSeat.seatLable,
                        ]);
                    }

                    requiredSeatsFound =
                        selected.length === selectedTicketCount;
                } else {
                    selected.splice(0, selected.length);

                    const remainingSeats = rowSeats.slice(index);
                    matchPossible =
                        remainingSeats.length >= selectedTicketCount;
                }
            }

            return selected;
        };

        if (
            !seatInfoReady ||
            hasAutoSuggestedRef.current ||
            selectedSeats.size > 0 ||
            selectedTicketCount <= 0 ||
            seats.length === 0 ||
            stageSize.width <= 0 ||
            stageSize.height <= 0
        ) {
            return;
        }

        let found = false;
        let selected: [string, string][] = [];

        for (let row = 1; row <= totalSeatRows && !found; row++) {
            const rowSeats = seats.filter(
                (seat) => seat.row === row && !bookedSeats.has(seat.seatId)
            );

            if (rowSeats.length >= selectedTicketCount) {
                selected = findConnectedSeats(rowSeats);
                found = selected.length > 0;
            }
        }

        if (!found) {
            selected = seats
                .filter((seat) => !bookedSeats.has(seat.seatId))
                .slice(0, selectedTicketCount)
                .map((seat) => [seat.seatId, seat.seatLable]);
        }

        hasAutoSuggestedRef.current = true;
        setSelectedSeats(new Map(selected));
    }, [
        bookedSeats,
        seatInfoReady,
        selectedSeats.size,
        selectedTicketCount,
        setSelectedSeats,
        totalSeatRows,
        seats,
        stageSize.height,
        stageSize.width,
    ]);

    const toggleSeat = (seatId: string, seatLabel: string) => {
        if (bookedSeats.has(seatId)) return;

        props.setSelectedSeats((previousSeats) => {
            const updatedSeats = new Map(previousSeats);

            if (updatedSeats.has(seatId)) {
                updatedSeats.delete(seatId);
            } else {
                if (updatedSeats.size === props.selectedTicketCount) {
                    return updatedSeats;
                }

                updatedSeats.set(seatId, seatLabel);
            }

            return updatedSeats;
        });
    };

    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current) return;

            setStageSize({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight,
            });
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const screenLabelWidth = 220;
    const screenLabelY = Math.max(28, screenMetrics.minY - 54);
    const beamBottomY = seatBounds
        ? Math.min(
              stageSize.height - 26,
              seatBounds.maxY + seatBounds.seatSize * 0.92
          )
        : stageSize.height * 0.78;
    const outerBeamSpreadX = Math.max(stageSize.width * 0.08, 52);
    const outerBeamPoints =
        screenCurve.length === 0
            ? []
            : [
                  ...screenMetrics.points,
                  screenMetrics.maxX + outerBeamSpreadX,
                  beamBottomY,
                  screenMetrics.minX - outerBeamSpreadX,
                  beamBottomY,
              ];
    const rowLabelRadius = Math.max(
        11,
        Math.min(16, (seatBounds?.seatSize ?? 32) * 0.3)
    );
    const leftRowLabelX = seatBounds
        ? seatBounds.minX - rowLabelRadius * 2.5
        : 24;
    const rightRowLabelX = seatBounds
        ? seatBounds.maxX + rowLabelRadius * 0.5
        : stageSize.width - rowLabelRadius * 2.5;
    const seatStrokeWidth = Math.max(1, (seatBounds?.seatSize ?? 32) * 0.035);

    return (
        <div
            ref={containerRef}
            className="relative h-[60vh] min-h-[540px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#040913] shadow-[0_35px_80px_rgba(0,0,0,0.38)] sm:h-[68vh] lg:min-h-[680px]"
        >
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                draggable={false}
            >
                <Layer>
                    <Rect
                        width={stageSize.width}
                        height={stageSize.height}
                        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                        fillLinearGradientEndPoint={{
                            x: 0,
                            y: stageSize.height,
                        }}
                        fillLinearGradientColorStops={[
                            0,
                            "#07101c",
                            0.45,
                            "#040916",
                            1,
                            "#030611",
                        ]}
                        preventDefault={false}
                    />
                    <Line
                        points={outerBeamPoints}
                        closed
                        fillLinearGradientStartPoint={{
                            x: screenMetrics.centerX,
                            y: screenMetrics.maxY,
                        }}
                        fillLinearGradientEndPoint={{
                            x: screenMetrics.centerX,
                            y: beamBottomY,
                        }}
                        fillLinearGradientColorStops={[
                            0,
                            "rgba(245, 248, 255, 0.15)",
                            0.32,
                            "rgba(158, 170, 195, 0.1)",
                            0.62,
                            "rgba(72, 82, 106, 0.06)",
                            1,
                            "rgba(8, 9, 14, 0.02)",
                        ]}
                        preventDefault={false}
                    />
                    <Line
                        points={screenMetrics.points}
                        stroke="rgba(245, 248, 255, 0.18)"
                        strokeWidth={18}
                        tension={0.5}
                        lineCap="round"
                        preventDefault={false}
                    />
                    <Line
                        points={screenMetrics.points}
                        stroke="rgba(244, 247, 252, 0.98)"
                        strokeWidth={5}
                        tension={0.5}
                        lineCap="round"
                        preventDefault={false}
                    />
                    <Text
                        text="SCREEN"
                        fontSize={layoutConfig.screenText.fontsize + 2}
                        width={screenLabelWidth}
                        align="center"
                        x={screenMetrics.centerX - screenLabelWidth / 2}
                        y={screenLabelY}
                        fill="rgba(245, 244, 240, 0.9)"
                        letterSpacing={4}
                        preventDefault={false}
                    />

                    {rowLabels.map((rowLabel) => (
                        <Group key={`row-label-left-${rowLabel.row}`}>
                            <Circle
                                x={leftRowLabelX + rowLabelRadius}
                                y={rowLabel.y}
                                radius={rowLabelRadius}
                                fill="rgba(10, 14, 21, 0.94)"
                                stroke="rgba(255, 255, 255, 0.08)"
                                strokeWidth={1}
                                preventDefault={false}
                            />
                            <Text
                                x={leftRowLabelX}
                                y={rowLabel.y - rowLabelRadius}
                                width={rowLabelRadius * 2}
                                height={rowLabelRadius * 2}
                                text={rowLabel.label}
                                align="center"
                                verticalAlign="middle"
                                fill="rgba(226, 231, 239, 0.64)"
                                fontSize={rowLabelRadius - 0.5}
                                preventDefault={false}
                            />
                        </Group>
                    ))}
                    {rowLabels.map((rowLabel) => (
                        <Group key={`row-label-right-${rowLabel.row}`}>
                            <Circle
                                x={rightRowLabelX + rowLabelRadius}
                                y={rowLabel.y}
                                radius={rowLabelRadius}
                                fill="rgba(10, 14, 21, 0.94)"
                                stroke="rgba(255, 255, 255, 0.08)"
                                strokeWidth={1}
                                preventDefault={false}
                            />
                            <Text
                                x={rightRowLabelX}
                                y={rowLabel.y - rowLabelRadius}
                                width={rowLabelRadius * 2}
                                height={rowLabelRadius * 2}
                                text={rowLabel.label}
                                align="center"
                                verticalAlign="middle"
                                fill="rgba(226, 231, 239, 0.64)"
                                fontSize={rowLabelRadius - 0.5}
                                preventDefault={false}
                            />
                        </Group>
                    ))}

                    {seats.map((seat) => {
                        const seatData = seatInfoById.get(seat.seatId);
                        const seatLabel = seat.seatLable;
                        const seatId = seatData
                            ? seatData.id
                            : `${seat.row}-${seat.col}`;
                        const isSelected = props.selectedSeats.has(seatId);
                        const isBooked = !!seatData?.isBooked;
                        const seatNumberFontSize = Math.max(8, seat.size * 0.2);
                        const scaleX = seat.size / SEAT_SHAPE_WIDTH;
                        const scaleY = seat.size / SEAT_SHAPE_HEIGHT;

                        const palette = isSelected
                            ? {
                                  top: "#f3d88d",
                                  bottom: "#b36f18",
                                  accent: "rgba(255, 247, 214, 0.22)",
                                  text: "#2f1c05",
                                  slash: "rgba(47, 28, 5, 0.18)",
                                  outline: "rgba(255, 239, 194, 0.16)",
                                  shadow: "rgba(120, 74, 16, 0.22)",
                              }
                            : isBooked
                              ? {
                                    top: "#8a909a",
                                    bottom: "#5f6671",
                                    accent: "rgba(255, 255, 255, 0.1)",
                                    text: "rgba(241, 244, 248, 0.58)",
                                    slash: "rgba(255, 255, 255, 0.14)",
                                    outline: "rgba(255, 255, 255, 0.08)",
                                    shadow: "rgba(17, 20, 26, 0.18)",
                                }
                              : {
                                    top: "#90b4ff",
                                    bottom: "#2f5fcb",
                                    accent: "rgba(255, 255, 255, 0.2)",
                                    text: "#f3f6fb",
                                    slash: "rgba(255, 255, 255, 0.08)",
                                    outline: "rgba(194, 215, 255, 0.14)",
                                    shadow: "rgba(26, 52, 112, 0.2)",
                                };

                        return (
                            <Group
                                key={seatId}
                                onClick={() =>
                                    !isBooked && toggleSeat(seatId, seatLabel)
                                }
                                onTouchEnd={() => {
                                    if (!isBooked) {
                                        toggleSeat(seatId, seatLabel);
                                    }
                                }}
                                onMouseEnter={(event) => {
                                    if (isBooked) return;

                                    event.target
                                        .getStage()
                                        ?.container()
                                        .style.setProperty("cursor", "pointer");
                                }}
                                onMouseLeave={(event) => {
                                    event.target
                                        .getStage()
                                        ?.container()
                                        .style.setProperty("cursor", "default");
                                }}
                            >
                                <Ellipse
                                    x={seat.x + seat.size * 0.5}
                                    y={seat.y + seat.size * 0.84}
                                    radiusX={seat.size * 0.32}
                                    radiusY={seat.size * 0.08}
                                    fill="rgba(0, 0, 0, 0.22)"
                                    opacity={0.55}
                                    preventDefault={false}
                                />
                                <Path
                                    data={SEAT_SHAPE_PATH}
                                    x={seat.x}
                                    y={seat.y}
                                    scaleX={scaleX}
                                    scaleY={scaleY}
                                    fillLinearGradientStartPoint={{
                                        x: 0,
                                        y: 0,
                                    }}
                                    fillLinearGradientEndPoint={{
                                        x: 0,
                                        y: SEAT_SHAPE_HEIGHT,
                                    }}
                                    fillLinearGradientColorStops={[
                                        0,
                                        palette.top,
                                        1,
                                        palette.bottom,
                                    ]}
                                    stroke={palette.outline}
                                    strokeWidth={seatStrokeWidth}
                                    shadowColor={palette.shadow}
                                    shadowBlur={isSelected ? 8 : 6}
                                    shadowOffsetY={seat.size * 0.08}
                                    shadowOpacity={isBooked ? 0.12 : 0.18}
                                    opacity={isBooked ? 0.7 : 1}
                                    preventDefault={false}
                                />
                                <Rect
                                    x={seat.x + seat.size * 0.18}
                                    y={seat.y + seat.size * 0.16}
                                    width={seat.size * 0.44}
                                    height={Math.max(2, seat.size * 0.055)}
                                    fill={palette.accent}
                                    cornerRadius={999}
                                    opacity={isBooked ? 0.6 : 1}
                                    preventDefault={false}
                                />
                                {isBooked ? (
                                    <Line
                                        points={[
                                            seat.x + seat.size * 0.22,
                                            seat.y + seat.size * 0.2,
                                            seat.x + seat.size * 0.78,
                                            seat.y + seat.size * 0.72,
                                        ]}
                                        stroke={palette.slash}
                                        strokeWidth={Math.max(
                                            1.5,
                                            seat.size * 0.045
                                        )}
                                        lineCap="round"
                                        preventDefault={false}
                                    />
                                ) : null}
                                <Text
                                    x={seat.x}
                                    y={seat.y + seat.size * 0.26}
                                    text={seatLabel}
                                    fontFamily="Arial"
                                    fontSize={seatNumberFontSize}
                                    fontStyle={isSelected ? "bold" : "normal"}
                                    fill={palette.text}
                                    alpha={isBooked ? 0.78 : 0.92}
                                    width={seat.size}
                                    height={seat.size * 0.3}
                                    align="center"
                                    verticalAlign="middle"
                                    preventDefault={false}
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
