import { PrismaClient } from "@prisma/client";
import seatMap from "./fixtures/seatMap.json";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting database seeding...");

    console.log("Start seeding seats...");
    console.log("Deleting existing seats...");
    await prisma.seat.deleteMany({});
    console.log("Existing seats deleted.");

    const { seats } = seatMap;

    console.log(`Creating ${seats.length} seats...`);

    await prisma.seat.createMany({
        data: seats,
        skipDuplicates: true,
    });

    console.log(`Created ${seats.length} seats.`);

    console.log("Seeding finished.");
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
