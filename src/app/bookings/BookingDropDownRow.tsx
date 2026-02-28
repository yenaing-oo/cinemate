import Image from "next/image";
import { Card, CardContent } from "~/components/ui/card";
import { formatShowtimeTime, formatShowtimeDate } from "~/lib/utils";
import { formatSeatFromCode } from "~/lib/utils";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Toast } from "~/components/ui/toast";

interface BookingDropdownRowProps {
    posterUrl?: string;
    movieTitle: string;
    showtime: Date;
    seats: { row: number; number: number }[];
    canCancel?: boolean;
    onCancel?: () => Promise<void>;
    cancelled?: boolean;
}

export function BookingDropDownRow({
    posterUrl,
    movieTitle,
    showtime,
    seats,
    canCancel = false,
    onCancel,
    cancelled = false,
}: BookingDropdownRowProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);

    const formattedTime = formatShowtimeTime(showtime);
    const formattedDate = formatShowtimeDate(showtime);
    const formattedSeats = seats
        .map((s) => formatSeatFromCode(s.row, s.number))
        .join(", ");

    const handleCancel = async () => {
        setLoading(true);
        try {
            if (onCancel) await onCancel();
            setToast({
                message: "Booking cancelled successfully.",
                type: "success",
            });
        } catch (e) {
            setToast({ message: "Failed to cancel booking.", type: "error" });
        } finally {
            setLoading(false);
            setDialogOpen(false);
        }
    };

    return (
        <Card className="border-border/60 bg-card/60 rounded-xl border p-1">
            <CardContent className="p-2">
                <details className="group">
                    <summary className="hover:bg-card/80 cursor-pointer list-none rounded-xl px-4 py-4 transition select-none">
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
                                <Image
                                    src={
                                        posterUrl ?? "/posters/placeholder.png"
                                    }
                                    alt={movieTitle}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                    {movieTitle}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    {formattedDate} @ {formattedTime}
                                </p>
                            </div>
                            <div className="text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                                ▾
                            </div>
                        </div>
                    </summary>
                    <div className="px-4 pb-4">
                        <div className="border-border/60 bg-card/40 mt-2 space-y-2 rounded-lg border p-5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Movie
                                </span>
                                <span className="font-medium">
                                    {movieTitle}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Showtime
                                </span>
                                <span className="font-medium">
                                    {formattedTime}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Seats
                                </span>
                                <span className="font-medium">
                                    {formattedSeats || "—"}
                                </span>
                            </div>
                            {canCancel && !cancelled && (
                                <div className="flex justify-end pt-4">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={loading}
                                        onClick={() => setDialogOpen(true)}
                                    >
                                        Cancel Booking
                                    </Button>
                                </div>
                            )}
                            {cancelled && (
                                <div className="flex justify-end pt-4">
                                    <span className="text-destructive font-semibold">
                                        Cancelled
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </details>
                <ConfirmDialog
                    open={dialogOpen}
                    title="Cancel Booking"
                    description="Are you sure you want to cancel this booking? This action cannot be undone."
                    confirmText="Yes, Cancel"
                    cancelText="Keep Booking"
                    onConfirm={handleCancel}
                    onCancel={() => setDialogOpen(false)}
                />
                {toast && <Toast message={toast.message} type={toast.type} />}
            </CardContent>
        </Card>
    );
}
