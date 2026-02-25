import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { splitList } from "~/lib/utils";
import SeatSelection from "./seatSelectionPage";

interface SeatMapPageProps {
    params: Promise<{ movieId: string; showtimeId: string }>;
}

export default async function SeatMapPage({ params }: SeatMapPageProps) {
    const { movieId, showtimeId } = await params;

    // Fetch showtimeID from DB to verify its existence

    // if DB not found, return not found page:
    // if (!showtimeId) {
    //     notFound();
    // }

    const movie = await api.movies.getById({ id: movieId });

    const seatInfo = await api.seats.getSeatsForShowtime({
        showtimeId: showtimeId,
    });

    if (!movie || !seatInfo) {
        notFound();
    }

    console.log("seat info: ", seatInfo);

    const movieDetails = {
        title: movie.title,
        posterUrl: movie.posterUrl ?? "",
        languages: splitList(movie.languages),
    };

    // Track selected seats: map seatId -> seatNumber for easy lookup
    // const [selectedSeats, setSelectedSeats] = useState<Map<string, string>>(
    //     new Map()
    // );

    // const getSelectedSeatNumbers = () => {
    //     return Array.from(selectedSeats.values());
    // };

    return (
        <SeatSelection
            props={{
                ...movieDetails,
                movieId: movieId,
                showtimeId: showtimeId,
                seatInfo: seatInfo,
            }}
        />
    );
}
