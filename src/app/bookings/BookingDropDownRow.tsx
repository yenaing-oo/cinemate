import Image from "next/image";
import { Card, CardContent } from "~/components/ui/card";
import { formatShowtime } from "~/lib/utils";
import { formatSeatFromCode } from "~/lib/utils";

interface BookingDropdownRowProps {
    posterUrl?: string;
    movieTitle: string;
    showtime: Date;
    seats: { row: number; number: number }[];
}

export function BookingDropDownRow({
    posterUrl,
    movieTitle,
    showtime,
    seats,
}: BookingDropdownRowProps) {
    const formattedTime = formatShowtime(showtime);

    const formattedSeats = seats
        .map((s) => formatSeatFromCode(s.row, s.number))
        .join(", ");

    return (
        <Card className="border-border/60 bg-card/60 rounded-xl border">
            <CardContent className="p-0">
                <details className="group">
                    <summary className="hover:bg-card/80 cursor-pointer list-none rounded-xl px-4 py-4 transition select-none">
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md">
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
                                    {formattedTime}
                                </p>
                            </div>

                            <div className="text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                                ▾
                            </div>
                        </div>
                    </summary>

                    <div className="px-4 pb-4">
                        <div className="border-border/60 bg-card/40 mt-2 space-y-2 rounded-lg border p-4 text-sm">
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
                        </div>
                    </div>
                </details>
            </CardContent>
        </Card>
    );
}
