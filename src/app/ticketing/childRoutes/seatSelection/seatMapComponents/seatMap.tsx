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
    const bookedSeats = useMemo(
        () =>
            new Set<string>(
                props.seatInfo
                    ?.filter((seat) => seat.isBooked)
                    .map((seat) => seat.id)
            ),
        [props.seatInfo]
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

    const seatInfoById = useMemo(
        () => new Map(props.seatInfo?.map((seat) => [seat.id, seat]) ?? []),
        [props.seatInfo]
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
            Array.from({ length: props.totalSeatRows }, (_, index) => {
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
        [props.totalSeatRows, seats]
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

    const beamTopY = Math.max(32, screenMetrics.minY - 10);
    const beamBottomY = seatBounds
        ? seatBounds.minY + Math.max(48, seatBounds.seatSize * 2)
        : stageSize.height * 0.46;
    const beamOuterWidth = Math.max(stageSize.width * 0.3, 160);
    const beamInnerWidth = beamOuterWidth * 0.62;
    const screenLabelWidth = 128;
    const rowLabelRadius = Math.max(
        12,
        Math.min(18, (seatBounds?.seatSize ?? 32) * 0.34)
    );
    const leftRowLabelX = seatBounds
        ? seatBounds.minX - rowLabelRadius * 2.5
        : 24;
    const rightRowLabelX = seatBounds
        ? seatBounds.maxX + rowLabelRadius * 0.5
        : stageSize.width - rowLabelRadius * 2.5;
    const floorGlowWidth = seatBounds
        ? Math.max(160, (seatBounds.maxX - seatBounds.minX) * 0.58)
        : Math.max(160, stageSize.width * 0.3);
    const floorGlowHeight = seatBounds
        ? Math.max(40, (seatBounds.maxY - seatBounds.minY) * 0.09)
        : 48;
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
                        ref={null}
                        width={stageSize.width}
                        height={stageSize.height}
                        fill={"#030816"}
                        preventDefault={false}
                    />
                    <Ellipse
                        x={stageSize.width * 0.18}
                        y={stageSize.height * 0.18}
                        radiusX={stageSize.width * 0.2}
                        radiusY={stageSize.height * 0.14}
                        fill="rgba(126, 146, 190, 0.14)"
                        preventDefault={false}
                    />
                    <Ellipse
                        x={stageSize.width * 0.82}
                        y={stageSize.height * 0.14}
                        radiusX={stageSize.width * 0.18}
                        radiusY={stageSize.height * 0.12}
                        fill="rgba(194, 159, 109, 0.1)"
                        preventDefault={false}
                    />
                    <Line
                        points={[
                            screenMetrics.centerX - beamOuterWidth * 0.26,
                            beamTopY,
                            screenMetrics.centerX + beamOuterWidth * 0.26,
                            beamTopY,
                            screenMetrics.centerX + beamOuterWidth,
                            beamBottomY,
                            screenMetrics.centerX - beamOuterWidth,
                            beamBottomY,
                        ]}
                        closed
                        fill="rgba(255, 247, 230, 0.06)"
                        preventDefault={false}
                    />
                    <Line
                        points={[
                            screenMetrics.centerX - beamInnerWidth * 0.26,
                            beamTopY + 12,
                            screenMetrics.centerX + beamInnerWidth * 0.26,
                            beamTopY + 12,
                            screenMetrics.centerX + beamInnerWidth,
                            beamBottomY,
                            screenMetrics.centerX - beamInnerWidth,
                            beamBottomY,
                        ]}
                        closed
                        fill="rgba(255, 233, 194, 0.08)"
                        preventDefault={false}
                    />
                    <Rect
                        x={screenMetrics.centerX - screenLabelWidth / 2}
                        y={screenMetrics.minY - 62}
                        width={screenLabelWidth}
                        height={30}
                        cornerRadius={999}
                        fill="rgba(12, 17, 24, 0.86)"
                        stroke="rgba(255, 255, 255, 0.14)"
                        strokeWidth={1}
                        preventDefault={false}
                    />
                    <Line
                        points={screenMetrics.points}
                        stroke="rgba(255, 239, 211, 0.16)"
                        strokeWidth={28}
                        tension={0.5}
                        lineCap="round"
                        preventDefault={false}
                    />
                    <Line
                        points={screenMetrics.points}
                        stroke="rgba(247, 249, 252, 0.94)"
                        strokeWidth={10}
                        tension={0.5}
                        lineCap="round"
                        preventDefault={false}
                    />
                    <Ellipse
                        x={screenMetrics.centerX}
                        y={screenMetrics.maxY + 22}
                        radiusX={
                            (screenMetrics.maxX - screenMetrics.minX) * 0.32
                        }
                        radiusY={18}
                        fill="rgba(255, 235, 201, 0.08)"
                        preventDefault={false}
                    />
                    <Text
                        text="SCREEN"
                        fontSize={layoutConfig.screenText.fontsize - 1}
                        width={screenLabelWidth}
                        align="center"
                        x={screenMetrics.centerX - screenLabelWidth / 2}
                        y={screenMetrics.minY - 55}
                        fill="rgba(248, 248, 245, 0.92)"
                        letterSpacing={4}
                        preventDefault={false}
                    />
                    {seatBounds ? (
                        <Ellipse
                            x={screenMetrics.centerX}
                            y={seatBounds.maxY + seatBounds.seatSize * 1.2}
                            radiusX={floorGlowWidth}
                            radiusY={floorGlowHeight}
                            fill="rgba(24, 36, 58, 0.28)"
                            preventDefault={false}
                        />
                    ) : null}
                    {rowLabels.map((rowLabel) => (
                        <Group key={`row-label-left-${rowLabel.row}`}>
                            <Circle
                                x={leftRowLabelX + rowLabelRadius}
                                y={rowLabel.y}
                                radius={rowLabelRadius}
                                fill="rgba(12, 17, 24, 0.84)"
                                stroke="rgba(255, 255, 255, 0.12)"
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
                                fill="rgba(235, 239, 247, 0.7)"
                                fontSize={rowLabelRadius}
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
                                fill="rgba(12, 17, 24, 0.84)"
                                stroke="rgba(255, 255, 255, 0.12)"
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
                                fill="rgba(235, 239, 247, 0.7)"
                                fontSize={rowLabelRadius}
                                preventDefault={false}
                            />
                        </Group>
                    ))}
                    {seats.map((seat) => {
                        const seatData = seatInfoById.get(seat.seatId);
                        const seatLable = seat.seatLable;
                        const seatId = seatData
                            ? seatData.id
                            : `${seat.row}-${seat.col}`;
                        const isSelected = props.selectedSeats.has(seatId);
                        const isBooked = !!seatData?.isBooked;

                        const seatNumberFontSize = Math.max(
                            10,
                            seat.size * 0.25
                        );
                        const palette = isSelected
                            ? {
                                  glow: "rgba(216, 163, 92, 0.28)",
                                  backTop: "#efd7ab",
                                  backBottom: "#c7a46b",
                                  baseTop: "#c98f43",
                                  baseBottom: "#81541f",
                                  armsTop: "#dfc18f",
                                  armsBottom: "#af8755",
                                  accent: "rgba(255, 247, 229, 0.34)",
                                  text: "#271705",
                                  slash: "rgba(39, 23, 5, 0.16)",
                                  outline: "rgba(255, 243, 220, 0.18)",
                              }
                            : isBooked
                              ? {
                                    glow: "rgba(0, 0, 0, 0)",
                                    backTop: "#667081",
                                    backBottom: "#4d5666",
                                    baseTop: "#38404d",
                                    baseBottom: "#232933",
                                    armsTop: "#778294",
                                    armsBottom: "#5f697a",
                                    accent: "rgba(255, 255, 255, 0.06)",
                                    text: "rgba(236, 239, 245, 0.48)",
                                    slash: "rgba(231, 238, 251, 0.12)",
                                    outline: "rgba(255, 255, 255, 0.05)",
                                }
                              : {
                                    glow: "rgba(110, 134, 190, 0.2)",
                                    backTop: "#9dadd0",
                                    backBottom: "#6e80a9",
                                    baseTop: "#485d87",
                                    baseBottom: "#2a3756",
                                    armsTop: "#7c8fb7",
                                    armsBottom: "#5c6f93",
                                    accent: "rgba(255, 255, 255, 0.18)",
                                    text: "#f4f7fb",
                                    slash: "rgba(255, 255, 255, 0.08)",
                                    outline: "rgba(255, 255, 255, 0.08)",
                                };

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
                                <Rect
                                    x={seat.x - seat.size * 0.04}
                                    y={seat.y - seat.size * 0.03}
                                    width={seat.size * 1.08}
                                    height={seat.size * 0.92}
                                    fill={palette.glow}
                                    cornerRadius={seat.size * 0.26}
                                    opacity={isSelected || !isBooked ? 1 : 0}
                                    preventDefault={false}
                                />
                                <Rect
                                    x={seat.x + seat.size * 0.12}
                                    y={seat.y + seat.size * 0.66}
                                    width={seat.size * 0.76}
                                    height={seat.size * 0.13}
                                    fill="rgba(0, 0, 0, 0.32)"
                                    cornerRadius={seat.size * 0.08}
                                    opacity={0.9}
                                    preventDefault={false}
                                />
                                <Rect
                                    x={seat.x}
                                    y={seat.y + seat.size * 0.28}
                                    width={seat.size * 0.14}
                                    height={seat.size * 0.32}
                                    fillLinearGradientStartPoint={{
                                        x: seat.x,
                                        y: seat.y + seat.size * 0.28,
                                    }}
                                    fillLinearGradientEndPoint={{
                                        x: seat.x,
                                        y: seat.y + seat.size * 0.6,
                                    }}
                                    fillLinearGradientColorStops={[
                                        0,
                                        palette.armsTop,
                                        1,
                                        palette.armsBottom,
                                    ]}
                                    stroke={palette.outline}
                                    strokeWidth={seatStrokeWidth}
                                    cornerRadius={seat.size * 0.08}
                                    opacity={isBooked ? 0.7 : 1}
                                    preventDefault={false}
                                />
                                <Rect
                                    x={seat.x + seat.size * 0.86}
                                    y={seat.y + seat.size * 0.28}
                                    width={seat.size * 0.14}
                                    height={seat.size * 0.32}
                                    fillLinearGradientStartPoint={{
                                        x: seat.x + seat.size * 0.86,
                                        y: seat.y + seat.size * 0.28,
                                    }}
                                    fillLinearGradientEndPoint={{
                                        x: seat.x + seat.size * 0.86,
                                        y: seat.y + seat.size * 0.6,
                                    }}
                                    fillLinearGradientColorStops={[
                                        0,
                                        palette.armsTop,
                                        1,
                                        palette.armsBottom,
                                    ]}
                                    stroke={palette.outline}
                                    strokeWidth={seatStrokeWidth}
                                    cornerRadius={seat.size * 0.08}
                                    opacity={isBooked ? 0.7 : 1}
                                    preventDefault={false}
                                />
                                <Rect
                                    x={seat.x + seat.size * 0.13}
                                    y={seat.y + seat.size * 0.04}
                                    width={seat.size * 0.74}
                                    height={seat.size * 0.34}
                                    fillLinearGradientStartPoint={{
                                        x: seat.x + seat.size * 0.13,
                                        y: seat.y + seat.size * 0.04,
                                    }}
                                    fillLinearGradientEndPoint={{
                                        x: seat.x + seat.size * 0.13,
                                        y: seat.y + seat.size * 0.38,
                                    }}
                                    fillLinearGradientColorStops={[
                                        0,
                                        palette.backTop,
                                        1,
                                        palette.backBottom,
                                    ]}
                                    stroke={palette.outline}
                                    strokeWidth={seatStrokeWidth}
                                    cornerRadius={seat.size * 0.18}
                                    preventDefault={false}
                                />
                                <Rect
                                    x={seat.x + seat.size * 0.08}
                                    y={seat.y + seat.size * 0.4}
                                    width={seat.size * 0.84}
                                    height={seat.size * 0.25}
                                    fillLinearGradientStartPoint={{
                                        x: seat.x + seat.size * 0.08,
                                        y: seat.y + seat.size * 0.4,
                                    }}
                                    fillLinearGradientEndPoint={{
                                        x: seat.x + seat.size * 0.08,
                                        y: seat.y + seat.size * 0.65,
                                    }}
                                    fillLinearGradientColorStops={[
                                        0,
                                        palette.baseTop,
                                        1,
                                        palette.baseBottom,
                                    ]}
                                    stroke={palette.outline}
                                    strokeWidth={seatStrokeWidth}
                                    cornerRadius={seat.size * 0.14}
                                    preventDefault={false}
                                />
                                <Rect
                                    x={seat.x + seat.size * 0.19}
                                    y={seat.y + seat.size * 0.12}
                                    width={seat.size * 0.5}
                                    height={Math.max(2, seat.size * 0.06)}
                                    fill={palette.accent}
                                    cornerRadius={999}
                                    opacity={isBooked ? 0.6 : 1}
                                    preventDefault={false}
                                />
                                {isBooked ? (
                                    <Line
                                        points={[
                                            seat.x + seat.size * 0.22,
                                            seat.y + seat.size * 0.18,
                                            seat.x + seat.size * 0.78,
                                            seat.y + seat.size * 0.72,
                                        ]}
                                        stroke={palette.slash}
                                        strokeWidth={Math.max(
                                            1.5,
                                            seat.size * 0.05
                                        )}
                                        lineCap="round"
                                        preventDefault={false}
                                    />
                                ) : null}
                                {isSelected ? (
                                    <Circle
                                        x={seat.x + seat.size * 0.82}
                                        y={seat.y + seat.size * 0.18}
                                        radius={Math.max(4, seat.size * 0.1)}
                                        fill="rgba(255, 249, 236, 0.92)"
                                        preventDefault={false}
                                    />
                                ) : null}
                                <Text
                                    key={`${seatId}-text`}
                                    x={seat.x}
                                    y={seat.y + seat.size * 0.06}
                                    text={seatLable}
                                    fontFamily="Arial"
                                    fontSize={seatNumberFontSize}
                                    fontStyle={isSelected ? "bold" : "normal"}
                                    fill={palette.text}
                                    alpha={isBooked ? 0.86 : 0.95}
                                    width={seat.size}
                                    height={seat.size * 0.82}
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
