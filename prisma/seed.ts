import { Prisma, PrismaClient, type Showtime } from "@prisma/client";
import seatMap from "./fixtures/seatMap.json";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting database seeding...");

    // 1. Always seed seats, as this is foundational data
    console.log("Start seeding seats...");
    await prisma.seat.deleteMany({});
    const { seats } = seatMap;
    await prisma.seat.createMany({
        data: seats,
        skipDuplicates: true,
    });
    console.log(`Created ${seats.length} seats.`);

    // 2. Check for a --dev flag to run development-specific seeding
    const isDevSeed = process.argv.includes("--dev");
    if (!isDevSeed) {
        console.log(
            "Seat seeding complete. Skipping development-specific data (movies, users, bookings)."
        );
        console.log(
            "To seed all sample data, run the script with the --dev flag."
        );
        return;
    }

    // --- Development-Only Seeding Logic ---
    console.log("Development seed flag detected. Seeding full sample data...");

    // 2. Clean up old sample data before creating new data
    console.log("Cleaning up old sample booking data...");
    await prisma.booking.deleteMany({
        where: { user: { email: "user@example.com" } },
    });
    await prisma.user.deleteMany({
        where: { email: "user@example.com" },
    });
    console.log("Cleanup complete.");

    // 3. Upsert sample movie and create its showtimes and seats
    console.log("Upserting sample movie and creating showtimes...");
    const movieData = {
        tmdbId: 550,
        title: "Fight Club",
        description:
            'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
        runtime: 139,
        releaseDate: new Date("1999-10-15"),
        posterUrl:
            "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        genres: "Drama, Thriller",
        rating: 8.4,
    };
    const sampleMovie = await prisma.movie.upsert({
        where: { tmdbId: movieData.tmdbId },
        update: {},
        create: movieData,
    });

    const allSeats = await prisma.seat.findMany();
    const showtimePrice = new Prisma.Decimal(15.0);
    const showtime1StartTime = new Date();
    showtime1StartTime.setDate(showtime1StartTime.getDate() + 1);
    showtime1StartTime.setHours(18, 0, 0, 0);

    const showtime2StartTime = new Date();
    showtime2StartTime.setDate(showtime2StartTime.getDate() + 1);
    showtime2StartTime.setHours(22, 0, 0, 0);

    await prisma.showtime.createMany({
        data: [
            {
                movieId: sampleMovie.id,
                startTime: showtime1StartTime,
                endTime: new Date(
                    showtime1StartTime.getTime() + sampleMovie.runtime * 60000
                ),
                price: showtimePrice,
                availableSeats: allSeats.length,
            },
            {
                movieId: sampleMovie.id,
                startTime: showtime2StartTime,
                endTime: new Date(
                    showtime2StartTime.getTime() + sampleMovie.runtime * 60000
                ),
                price: showtimePrice,
                availableSeats: allSeats.length,
            },
        ],
        skipDuplicates: true,
    });

    // Fetch the showtimes we just created to ensure we have their IDs
    const createdShowtimes = await prisma.showtime.findMany({
        where: {
            movieId: sampleMovie.id,
            startTime: { in: [showtime1StartTime, showtime2StartTime] },
        },
    });

    // Create ShowtimeSeat entries for the new showtimes
    const showtimeSeatsToCreate = createdShowtimes.flatMap((showtime) =>
        allSeats.map((seat) => ({
            showtimeId: showtime.id,
            seatId: seat.id,
        }))
    );
    await prisma.showtimeSeat.createMany({
        data: showtimeSeatsToCreate,
        skipDuplicates: true,
    });

    console.log(
        `Ensured sample movie "${sampleMovie.title}" and its showtimes exist.`
    );

    // 4. Create a sample user
    console.log("Creating a sample user...");
    const user = await prisma.user.create({
        data: {
            name: "John Doe",
            email: "user@example.com",
            emailVerified: new Date(),
        },
    });
    console.log(`Created sample user: ${user.email}`);

    // 5. Create sample bookings using the showtimes we just made
    console.log("Seeding sample bookings...");

    if (createdShowtimes.length !== 2) {
        console.error(
            "Failed to create or find the specific sample showtimes for booking. Seeding cannot proceed."
        );
        return;
    }

    const [showtimeForBooking1, showtimeForBooking2] = createdShowtimes as [
        Showtime,
        Showtime,
    ];

    // --- Booking 1: Single Ticket ---
    const seatForBooking1 = await prisma.showtimeSeat.findFirst({
        where: { showtimeId: showtimeForBooking1.id, status: "AVAILABLE" },
    });

    if (!seatForBooking1) {
        console.error(
            `Could not find an available seat for showtime ${showtimeForBooking1.id} to create the first booking.`
        );
        return;
    }

    console.log("Creating booking with 1 ticket...");
    await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
            data: {
                userId: user.id,
                showtimeId: showtimeForBooking1.id,
                ticketCount: 1,
                totalAmount: showtimeForBooking1.price,
            },
        });
        await tx.ticket.create({
            data: {
                bookingId: booking.id,
                seatId: seatForBooking1.seatId,
                showtimeId: showtimeForBooking1.id,
                price: showtimeForBooking1.price,
            },
        });
        await tx.showtimeSeat.update({
            where: { id: seatForBooking1.id },
            data: { status: "BOOKED" },
        });
        await tx.showtime.update({
            where: { id: showtimeForBooking1.id },
            data: { availableSeats: { decrement: 1 } },
        });
        console.log(`- Booking ${booking.id} created with 1 ticket.`);
    });

    // --- Booking 2: Multiple Tickets ---
    const seatsForBooking2 = await prisma.showtimeSeat.findMany({
        where: { showtimeId: showtimeForBooking2.id, status: "AVAILABLE" },
        take: 3,
    });

    if (seatsForBooking2.length !== 3) {
        console.error(
            `Could not find 3 available seats for showtime ${showtimeForBooking2.id} to create the second booking.`
        );
        return;
    }

    console.log("Creating booking with 3 tickets...");
    await prisma.$transaction(async (tx) => {
        const ticketCount = 3;
        const booking = await tx.booking.create({
            data: {
                userId: user.id,
                showtimeId: showtimeForBooking2.id,
                ticketCount: ticketCount,
                totalAmount: showtimeForBooking2.price.mul(ticketCount),
            },
        });

        const ticketsToCreate = seatsForBooking2.map((seat) => ({
            bookingId: booking.id,
            seatId: seat.seatId,
            showtimeId: showtimeForBooking2.id,
            price: showtimeForBooking2.price,
        }));

        await tx.ticket.createMany({
            data: ticketsToCreate,
        });

        const seatIdsToUpdate = seatsForBooking2.map((seat) => seat.id);

        await tx.showtimeSeat.updateMany({
            where: { id: { in: seatIdsToUpdate } },
            data: { status: "BOOKED" },
        });

        await tx.showtime.update({
            where: { id: showtimeForBooking2.id },
            data: { availableSeats: { decrement: ticketCount } },
        });

        console.log(
            `- Booking ${booking.id} created with ${ticketCount} tickets.`
        );
    });
}

main()
    .catch((e) => {
        console.error("An error occurred while seeding the database:");
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log("Database connection closed.");
    });
