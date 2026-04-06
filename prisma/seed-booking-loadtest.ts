import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_USER_COUNT = 20;
const DEFAULT_USER_EMAIL_PREFIX = "booking-loadtest";
const DEFAULT_USER_EMAIL_DOMAIN = "example.com";

function asNumber(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function asCsvArray(value: string | undefined) {
    if (!value) {
        return [];
    }

    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function buildSequentialEmailList(count: number) {
    const prefix =
        process.env.BOOKING_USER_EMAIL_PREFIX?.trim() ||
        DEFAULT_USER_EMAIL_PREFIX;
    const domain =
        process.env.BOOKING_USER_EMAIL_DOMAIN?.trim() ||
        DEFAULT_USER_EMAIL_DOMAIN;
    const width = Math.max(2, String(Math.max(count, 1)).length);

    return Array.from({ length: count }, (_, index) => {
        const sequence = String(index + 1).padStart(width, "0");
        return `${prefix}-${sequence}@${domain}`;
    });
}

function getLoadTestUserEmails() {
    const explicitEmails = asCsvArray(process.env.TEST_USER_EMAILS);

    if (explicitEmails.length > 0) {
        return explicitEmails;
    }

    const userCount = Math.max(
        1,
        asNumber(
            process.env.BOOKING_LOAD_VUS ?? process.env.LOAD_VUS,
            DEFAULT_USER_COUNT
        )
    );

    return buildSequentialEmailList(userCount);
}

function getLoadTestSupabaseId(email: string, index: number) {
    const localPart = email.split("@")[0] ?? `user-${index + 1}`;
    const normalizedLocalPart = localPart
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return `booking-loadtest-user-${normalizedLocalPart || index + 1}`;
}

async function main() {
    const loadTestUserEmails = getLoadTestUserEmails();

    console.log("Seeding booking load test users...");
    console.log(`Using ${loadTestUserEmails.length} load test users.`);

    await prisma.bookingSession.deleteMany({
        where: {
            user: {
                email: {
                    in: loadTestUserEmails,
                },
            },
        },
    });

    await prisma.ticket.deleteMany({
        where: {
            booking: {
                user: {
                    email: {
                        in: loadTestUserEmails,
                    },
                },
            },
        },
    });

    await prisma.booking.deleteMany({
        where: {
            user: {
                email: {
                    in: loadTestUserEmails,
                },
            },
        },
    });

    await prisma.user.deleteMany({
        where: {
            email: {
                in: loadTestUserEmails,
            },
        },
    });

    const users = await Promise.all(
        loadTestUserEmails.map((email, index) =>
            prisma.user.create({
                data: {
                    email,
                    firstName: "LoadTest",
                    lastName: `User${String(index + 1).padStart(2, "0")}`,
                    supabaseId: getLoadTestSupabaseId(email, index),
                    hasPaymentMethod: true,
                },
            })
        )
    );

    console.log(`Seeded ${users.length} booking load test users.`);
    console.log(
        `Booking load test users are ready for: ${loadTestUserEmails.join(", ")}`
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
