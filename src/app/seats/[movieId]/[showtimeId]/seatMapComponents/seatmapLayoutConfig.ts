export const layoutConfig = {
    screenUI: {
        horizontalSpreadPercent: 0.6, // 60% of stage width
        verticalSpreadPercent: 0.05, // 5% of stage width
        distanceFromTop: 150,
    },
    screenText: {
        fontsize: 20,
        width: 200,
        verticalDistanceFromScreenUI: 40, // Top of curved screenUI
    },
    section: {
        paddingXPercent: 0.3, // left & right spacing
        paddingTop: 110, // seats start Y
        paddingBottom: 110,
    },
    seats: {
        size: 45,
        gap: 12,
        rowGap: 20,
    },
    curvature: {
        enabled: true,
        intensity: 20, // pixels of curve height
    },
    seatNumber: {
        maxFontSize: 20,
        mixFontSize: 10,
    },
};
