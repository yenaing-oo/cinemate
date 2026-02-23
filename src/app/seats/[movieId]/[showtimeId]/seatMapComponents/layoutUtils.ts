import { layoutConfig } from "./seatmapLayoutConfig";

export interface ScreenPosition {
    x: number;
    y: number;
}

export const calculateScreenLayout = (stageWidth: number): ScreenPosition[] => {
    const totalWidth =
        stageWidth * layoutConfig.screenUI.horizontalSpreadPercent; // 60% of canvas width
    const totalHeight =
        stageWidth * layoutConfig.screenUI.verticalSpreadPercent; // flat vertical thickness
    const x = stageWidth / 2;
    const y = layoutConfig.screenUI.distanceFromTop; // distance from top

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
    size: number; // include dynamic seat size
    seatNumber: string;
}

export const calculateSeatLayout = (
    stageWidth: number,
    stageHeight: number,
    rows: number,
    seatsPerRow: number
): SeatPosition[] => {
    const { screenUI, seats, section, curvature } = layoutConfig;
    const rowID: String[] = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
    ];

    // Calculate max available width for seats
    const availableWidth = stageWidth * (2 * section.paddingXPercent);
    const maxSeatSizeWidth =
        (availableWidth - (seatsPerRow - 1) * seats.gap) / seatsPerRow;

    // Calculate max available height for seats
    const availableHeight =
        stageHeight - section.paddingTop - section.paddingBottom;
    const maxSeatSizeHeight =
        (availableHeight - (rows - 1) * seats.rowGap) / rows;

    // Choose smaller dimension to fit all seats
    let dynamicSeatSize = Math.min(
        maxSeatSizeWidth,
        maxSeatSizeHeight,
        seats.size
    );

    const layout: SeatPosition[] = [];

    for (let r = 0; r < rows; r++) {
        const rowWidth =
            seatsPerRow * dynamicSeatSize + (seatsPerRow - 1) * seats.gap;
        const rowStartX = (stageWidth - rowWidth) / 2;

        for (let c = 0; c < seatsPerRow; c++) {
            let x = rowStartX + c * (dynamicSeatSize + seats.gap);
            let y =
                screenUI.distanceFromTop +
                section.paddingTop +
                r * (dynamicSeatSize + seats.rowGap);

            // Apply curvature if enabled
            if (curvature.enabled) {
                const t = c / (seatsPerRow - 1);
                const curveOffset = Math.sin(t * Math.PI) * curvature.intensity;
                y += curveOffset;
            }

            layout.push({
                x,
                y,
                row: r,
                col: c,
                size: dynamicSeatSize,
                seatNumber: `${rowID[r]}${c + 1}`,
            });
        }
    }

    return layout;
};
