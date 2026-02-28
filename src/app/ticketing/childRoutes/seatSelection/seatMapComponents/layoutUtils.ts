import { layoutConfig } from "./seatmapLayoutConfig";
import { formatSeatFromCode } from "~/lib/utils";

export interface ScreenPosition {
    x: number;
    y: number;
}

export const calculateScreenLayout = (
    stageWidth: number,
    stageHeight: number
): ScreenPosition[] => {
    const totalWidth =
        stageWidth * layoutConfig.screenUI.horizontalSpreadPercent; // 60% of canvas width
    const totalHeight =
        stageWidth * layoutConfig.screenUI.verticalSpreadPercent; // flat vertical thickness
    const x = stageWidth / 2;
    const y = stageHeight * layoutConfig.screenUI.distanceFromTopPercent; // distance from top

    const leftX = x - totalWidth / 2;

    // Create points along a flat ellipse curve
    const points: ScreenPosition[] = [];
    const segments = 50; // more segments = smoother
    for (let i = 0; i <= segments; i++) {
        const t = i / segments; // 0 -> 1
        const px = leftX + t * totalWidth; // x position
        const py = y - Math.sin(t * Math.PI) * totalHeight; // sine curve for flat arc
        points.push({ x: px, y: py });
    }

    return points;
};

export interface SeatPosition {
    x: number;
    y: number;
    row: number;
    col: number;
    seatId: string;
    size: number; // include dynamic seat size
    seatLable: string;
}

export const calculateSeatLayout = (
    stageWidth: number,
    stageHeight: number,
    rows: number,
    seatsPerRow: number,
    seatInfo?: {
        seatId: string;
        row: number;
        number: number;
        isBooked: Boolean;
    }[]
): SeatPosition[] => {
    const { screenUI, seats, section, curvature } = layoutConfig;

    // Calculate max available width for seats
    const availableWidth = stageWidth * (2 * section.paddingXPercent);
    const maxSeatSizeWidth =
        (availableWidth - (seatsPerRow - 1) * seats.gap) / seatsPerRow;

    // Calculate max available height for seats
    const availableHeight =
        stageHeight -
        stageHeight * screenUI.distanceFromTopPercent -
        stageHeight * section.paddingTopPercent -
        section.paddingBottom;
    const maxSeatSizeHeight =
        (availableHeight - (rows - 1) * seats.rowGap) / rows;

    // Choose smaller dimension to fit all seats
    let dynamicSeatSize = Math.min(
        maxSeatSizeWidth,
        maxSeatSizeHeight,
        seats.size
    );

    const layout: SeatPosition[] = [];

    for (let r = 1; r <= rows; r++) {
        const rowWidth =
            seatsPerRow * dynamicSeatSize + (seatsPerRow - 1) * seats.gap;
        const rowStartX = (stageWidth - rowWidth) / 2;

        for (let c = 1; c <= seatsPerRow; c++) {
            const rowHeight = (r - 1) * (dynamicSeatSize + seats.rowGap);
            let x = rowStartX + (c - 1) * (dynamicSeatSize + seats.gap);
            let y =
                stageHeight * screenUI.distanceFromTopPercent +
                stageHeight * section.paddingTopPercent +
                rowHeight;

            // Apply curvature if enabled
            if (curvature.enabled) {
                const t = (c - 1) / (seatsPerRow - 1);
                const curveOffset = Math.sin(t * Math.PI) * curvature.intensity;
                y += curveOffset;
            }

            const seatDetail = seatInfo?.find(
                (s) => s.row === r && s.number === c
            );

            layout.push({
                x,
                y,
                row: r,
                col: c,
                seatId: seatDetail ? seatDetail.seatId : `${r}-${c}`,
                size: dynamicSeatSize,
                seatLable: formatSeatFromCode(r, c),
            });
        }
    }

    return layout;
};
