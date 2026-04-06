// @ts-nocheck
import {
    fetchNowPlaying,
    fetchShowtimesByMovie,
} from "../features/movie-showtime/requests.js";
import { fetchShowtimeSeats } from "../features/booking/requests.js";

function getMoviesFromNowPlayingResponse(response) {
    try {
        const movies = response.json("result.data.json");
        return Array.isArray(movies) ? movies.filter((movie) => movie?.id) : [];
    } catch {
        return [];
    }
}

function getShowtimesFromResponse(response) {
    try {
        const showtimes = response.json("result.data.json.showtimes");
        return Array.isArray(showtimes)
            ? showtimes.filter((showtime) => showtime?.id)
            : [];
    } catch {
        return [];
    }
}

function getAvailableSeatCountFromResponse(response) {
    try {
        const seats = response.json("result.data.json");

        if (!Array.isArray(seats)) {
            return 0;
        }

        return seats.filter((seat) => seat?.id && !seat?.isBooked).length;
    } catch {
        return 0;
    }
}

export function resolveShowtime(options) {
    const nowPlayingResponse = fetchNowPlaying(options.baseUrl);
    const movies = getMoviesFromNowPlayingResponse(nowPlayingResponse);

    if (nowPlayingResponse.status !== 200 || movies.length === 0) {
        throw new Error(
            `Unable to auto-resolve a ${options.contextLabel} showtime from movies.nowPlaying`
        );
    }

    let bestCandidate = null;

    for (const movie of movies) {
        const showtimesResponse = fetchShowtimesByMovie(
            options.baseUrl,
            movie.id
        );
        const showtimes = getShowtimesFromResponse(showtimesResponse);

        if (showtimesResponse.status !== 200 || showtimes.length === 0) {
            continue;
        }

        for (const showtime of showtimes) {
            const seatLookup = fetchShowtimeSeats(
                options.baseUrl,
                showtime.id,
                options.authHeaders
            );

            if (seatLookup.status === 401) {
                throw new Error(
                    options.getUnauthorizedMessage(
                        options.authUserLabel,
                        seatLookup
                    )
                );
            }

            const availableSeatCount =
                getAvailableSeatCountFromResponse(seatLookup);

            if (seatLookup.status !== 200) {
                continue;
            }

            const candidate = {
                source: "auto",
                showtimeId: showtime.id,
                movieTitle: movie.title ?? movie.id,
                startTime: showtime.startTime ?? null,
                availableSeatCount,
            };

            if (availableSeatCount >= options.requiredSeatCapacity) {
                return candidate;
            }

            if (
                availableSeatCount >= options.minimumSeatCount &&
                (!bestCandidate ||
                    availableSeatCount > bestCandidate.availableSeatCount)
            ) {
                bestCandidate = candidate;
            }
        }
    }

    if (bestCandidate) {
        throw new Error(
            `Unable to auto-resolve a showtime with at least ${options.requiredSeatCapacity} available seats. Best candidate ${bestCandidate.showtimeId} (${bestCandidate.movieTitle}) had ${bestCandidate.availableSeatCount}. Seed more seats or reduce the ${options.contextLabel} load.`
        );
    }

    throw new Error(
        `Unable to auto-resolve a ${options.contextLabel} showtime from now-playing movies with future showtimes`
    );
}
