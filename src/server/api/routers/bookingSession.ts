import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
    BOOKING_SESSION_DURATION_MS,
    SEAT_HOLD_DURATION_MS,
} from "../../config";
import {
    BookingStatus,
    BookingStep,
    TicketStatus,
    WatchPartyStatus,
    type PrismaClient,
} from "@prisma/client";
import { Resend } from "resend";
import TicketConfirmation from "~/server/emailTemplates/TicketConfirmation";
import {
    formatBookingNumber,
    formatCad,
    formatSeatFromCode,
    formatShowtimeDate,
    formatShowtimeTime,
} from "~/lib/utils";
import { formatPaymentDateTime, maskCardNumber } from "~/server/utils";

export const bookingSessionRouter = createTRPCRouter({
    create: protectedProcedure
        .input(
            z.object({
                showtimeId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const now = new Date();
            const expiresAt = new Date(
                now.getTime() + BOOKING_SESSION_DURATION_MS
            );
            // Delete any existing sessions for this user
            await ctx.db.bookingSession.deleteMany({
                where: {
                    userId: ctx.user.id,
                },
            });
            return ctx.db.bookingSession.create({
                data: {
                    userId: ctx.user.id,
                    showtimeId: input.showtimeId,
                    step: BookingStep.TICKET_QUANTITY,
                    startedAt: now,
                    expiresAt,
                },
                include: {
                    showtime: {
                        include: {
                            movie: {
                                select: {
                                    id: true,
                                    title: true,
                                    posterUrl: true,
                                    backdropUrl: true,
                                    languages: true,
                                },
                            },
                        },
                    },
                },
            });
        }),

    createForWatchParty: protectedProcedure
        .input(
            z.object({
                watchPartyId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const now = new Date();
            const expiresAt = new Date(
                now.getTime() + BOOKING_SESSION_DURATION_MS
            );
            // Validate the watch party
            const watchParty = await ctx.db.watchParty.findUnique({
                where: { id: input.watchPartyId },
                select: {
                    id: true,
                    hostUserId: true,
                    showtimeId: true,
                    status: true,
                    _count: { select: { participants: true } },
                },
            });

            if (!watchParty) {
                throw new Error("Watch party not found.");
            }
            if (watchParty.hostUserId !== ctx.user.id) {
                throw new Error(
                    "Only the watch party host can create a booking session for the group."
                );
            }
            if (watchParty.status === WatchPartyStatus.CONFIRMED) {
                throw new Error(
                    "A booking has already been confirmed for this watch party."
                );
            }
            if (watchParty._count.participants === 0) {
                throw new Error(
                    "The watch party must have at least one participant besides the host before booking."
                );
            }
            if (!watchParty.showtimeId) {
                throw new Error(
                    "The watch party does not have an associated showtime."
                );
            }

            const showtimeId = watchParty.showtimeId;

            // Total seats = host + participants
            const ticketCount = 1 + watchParty._count.participants;

            // Verify enough seats are available for the whole group
            const availableSeatsCount = await ctx.db.showtimeSeat.count({
                where: {
                    showtimeId,
                    isBooked: false,
                    OR: [
                        { heldTill: null },
                        { heldTill: { lt: now } },
                        { heldByUserId: ctx.user.id },
                    ],
                },
            });
            if (availableSeatsCount < ticketCount) {
                throw new Error(
                    "Not enough seats available for all watch party members."
                );
            }

            return ctx.db.$transaction(async (tx) => {
                // Delete any existing sessions for this user
                await tx.bookingSession.deleteMany({
                    where: { userId: ctx.user.id },
                });

                // Closing the party prevents late joins after the host has
                // locked the group size used to reserve seats.
                if (watchParty.status === WatchPartyStatus.OPEN) {
                    await tx.watchParty.update({
                        where: { id: input.watchPartyId },
                        data: { status: WatchPartyStatus.CLOSED },
                    });
                }

                return tx.bookingSession.create({
                    data: {
                        userId: ctx.user.id,
                        showtimeId: showtimeId,
                        watchPartyId: input.watchPartyId,
                        step: BookingStep.SEAT_SELECTION,
                        ticketCount,
                        startedAt: now,
                        expiresAt,
                    },
                    include: {
                        showtime: {
                            include: {
                                movie: {
                                    select: {
                                        id: true,
                                        title: true,
                                        posterUrl: true,
                                        backdropUrl: true,
                                        languages: true,
                                    },
                                },
                            },
                        },
                    },
                });
            });
        }),

    get: protectedProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const session = await ctx.db.bookingSession.findFirst({
            where: {
                userId: ctx.user.id,
                expiresAt: { gt: now },
                step: { not: BookingStep.COMPLETED },
                OR: [
                    { watchPartyId: null },
                    {
                        watchParty: {
                            status: {
                                in: [WatchPartyStatus.CLOSED],
                            },
                        },
                    },
                ],
            },
            orderBy: { startedAt: "desc" },
            include: {
                showtime: {
                    include: {
                        movie: {
                            select: {
                                id: true,
                                title: true,
                                posterUrl: true,
                                backdropUrl: true,
                                languages: true,
                            },
                        },
                    },
                },
                watchParty: {
                    select: {
                        id: true,
                        name: true,
                        hostUser: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        participants: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                            orderBy: [
                                { firstName: "asc" },
                                { lastName: "asc" },
                                { email: "asc" },
                            ],
                        },
                    },
                },
                selectedSeats: {
                    include: {
                        seat: {
                            select: {
                                id: true,
                                row: true,
                                number: true,
                            },
                        },
                    },
                },
            },
        });

        if (!session) {
            return null;
        }

        // Watch-party sessions reserve multiple seats, but checkout charges only
        // the host's ticket; member bookings are created individually at completion.
        const payableTicketCount = session.watchPartyId
            ? 1
            : session.selectedSeats.length;

        return {
            ...session,
            payableTicketCount,
        };
    }),

    update: protectedProcedure
        .input(
            z.object({
                sessionId: z.string(),
                goToStep: z
                    .enum(
                        Object.values(BookingStep) as [
                            BookingStep,
                            ...BookingStep[],
                        ]
                    )
                    .optional(),
                ticketCount: z.number().int().positive().optional(),
                selectedSeatIds: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const now = new Date();
            const session = await ctx.db.bookingSession.findUniqueOrThrow({
                where: { id: input.sessionId },
                include: { selectedSeats: true },
            });

            validateSession(session, ctx.user.id, now);

            if (
                session.step === BookingStep.TICKET_QUANTITY &&
                input.goToStep === BookingStep.SEAT_SELECTION
            ) {
                if (session.watchPartyId) {
                    throw new Error(
                        "Watch party booking sessions start at seat selection — ticket quantity step is not applicable."
                    );
                }
                if (!input.ticketCount) {
                    throw new Error(
                        "Ticket count is required for seat selection"
                    );
                }
                await setTicketCount(
                    ctx.db,
                    input.ticketCount,
                    session.showtimeId,
                    ctx.user.id,
                    session.id,
                    now
                );
                return;
            } else if (
                session.step === BookingStep.SEAT_SELECTION &&
                input.goToStep === BookingStep.TICKET_QUANTITY
            ) {
                if (session.watchPartyId) {
                    throw new Error(
                        "Watch party booking sessions do not support the ticket quantity step."
                    );
                }
                await goBackToTicketQuantity(ctx.db, session.id);
                return;
            } else if (
                session.step === BookingStep.SEAT_SELECTION &&
                input.goToStep === BookingStep.CHECKOUT
            ) {
                if (!input.selectedSeatIds) {
                    throw new Error(
                        "Selected seat IDs are required for checkout"
                    );
                }
                if (input.selectedSeatIds.length !== session.ticketCount) {
                    throw new Error(
                        "Selected seat count does not match ticket count"
                    );
                }
                await reserveSeats(
                    ctx.db,
                    session.showtimeId,
                    input.selectedSeatIds,
                    ctx.user.id,
                    session.id,
                    now
                );
                return;
            } else if (
                session.step === BookingStep.CHECKOUT &&
                input.goToStep === BookingStep.SEAT_SELECTION
            ) {
                await goBackToSeatSelection(ctx.db, session);
                return;
            } else if (
                session.step === BookingStep.CHECKOUT &&
                input.goToStep === BookingStep.COMPLETED
            ) {
                await completeBooking(ctx.db, session);
                return;
            } else {
                throw new Error(
                    "Invalid step transition. Cannot go from " +
                        session.step +
                        " to " +
                        input.goToStep
                );
            }
        }),
});

export function validateSession(session: any, userId: string, now: Date) {
    if (!session) {
        throw new Error("Session not found");
    }
    if (session.userId !== userId) {
        throw new Error("Unauthorized");
    }
    if (session.expiresAt < now || session.step === BookingStep.COMPLETED) {
        throw new Error("Session has expired");
    }
}

/**
 * Validates ticket quantity against currently available inventory before
 * moving a standard booking session into seat selection.
 */
export async function setTicketCount(
    db: PrismaClient,
    ticketCount: number,
    showtimeId: string,
    userId: string,
    bookingSessionId: string,
    now: Date
) {
    // Count seats held by the same user as still available so quantity changes
    // do not fail while this user is actively holding seats.
    const availableSeatsCount = await db.showtimeSeat.count({
        where: {
            showtimeId,
            isBooked: false,
            OR: [
                { heldTill: null },
                { heldTill: { lt: now } },
                { heldByUserId: userId },
            ],
        },
    });
    if (availableSeatsCount < ticketCount) {
        throw new Error(
            "Not enough seats available for the requested ticket count"
        );
    }
    await db.bookingSession.update({
        where: { id: bookingSessionId },
        data: {
            step: BookingStep.SEAT_SELECTION,
            ticketCount,
        },
    });
}

export async function goBackToTicketQuantity(
    db: PrismaClient,
    bookingSessionId: string
) {
    await db.bookingSession.update({
        where: { id: bookingSessionId },
        data: {
            step: BookingStep.TICKET_QUANTITY,
        },
    });
}

/**
 * Reserves all requested seats atomically so checkout never proceeds with a
 * partially-held group of seats.
 */
export async function reserveSeats(
    db: PrismaClient,
    showtimeId: string,
    seatIds: string[],
    userId: string,
    bookingSessionId: string,
    now: Date
) {
    await db.$transaction(async (tx) => {
        // Reserve all requested seats in one write to avoid partial holds caused
        // by concurrent checkouts.
        const count = await tx.showtimeSeat.updateMany({
            where: {
                showtimeId: showtimeId,
                seatId: { in: seatIds },
                isBooked: false,
                OR: [
                    { heldTill: null },
                    { heldTill: { lt: now } },
                    { heldByUserId: userId },
                ],
            },
            data: {
                heldByUserId: userId,
                heldTill: new Date(now.getTime() + SEAT_HOLD_DURATION_MS),
            },
        });

        if (count.count !== seatIds.length) {
            throw new Error(
                "Some selected seats are no longer available. Please choose different seats."
            );
        }

        // Persist the selected showtimeSeat ids onto the session so checkout can
        // render from server state and survive client refreshes.
        const showtimeSeatIds = await tx.showtimeSeat.findMany({
            where: {
                showtimeId,
                seatId: { in: seatIds },
            },
            select: { id: true },
        });

        await tx.bookingSession.update({
            where: { id: bookingSessionId },
            data: {
                // Advancing the step here keeps the session and held-seat state
                // in sync inside the same transaction.
                step: BookingStep.CHECKOUT,
                selectedSeats: {
                    connect: showtimeSeatIds.map((s) => ({ id: s.id })),
                },
            },
        });
    });
}

/**
 * Rewinds checkout back to seat selection and releases any unbooked holds
 * owned by this session.
 */
export async function goBackToSeatSelection(
    db: PrismaClient,
    session: {
        id: string;
        selectedSeats: { id: string }[];
    }
) {
    await db.$transaction(async (tx) => {
        if (session.selectedSeats.length > 0) {
            // Release only seats still attached to this session and not booked.
            await tx.showtimeSeat.updateMany({
                where: {
                    id: { in: session.selectedSeats.map((seat) => seat.id) },
                    bookingSessionId: session.id,
                    isBooked: false,
                },
                data: {
                    heldByUserId: null,
                    heldTill: null,
                    bookingSessionId: null,
                },
            });
        }

        await tx.bookingSession.update({
            where: { id: session.id },
            data: {
                step: BookingStep.SEAT_SELECTION,
            },
        });
    });
}

/**
 * Finalizes the booking session, creates bookings and tickets, and updates
 * watch party state when the session belongs to a coordinated group purchase.
 */
async function completeBooking(db: PrismaClient, session: any) {
    const confirmationEmails: Array<{
        userEmail: string;
        movieTitle: string;
        posterUrl: string;
        showDate: string;
        showTime: string;
        seatLabelList: string[];
        totalPrice: string;
        bookingId: string;
        paymentMethod: string;
        paymentDateTime: string;
    }> = [];

    await db.$transaction(async (tx) => {
        // 1. Mark seats as booked
        if (
            process.env.LOAD_TEST_MODE === undefined ||
            process.env.LOAD_TEST_MODE === "false"
        ) {
            // Load tests skip the booking write path so repeated runs do not
            // permanently consume seeded inventory.
            const count = await tx.showtimeSeat.updateMany({
                where: {
                    id: { in: session.selectedSeats.map((s: any) => s.id) },
                    isBooked: false,
                    heldByUserId: session.userId,
                },
                data: {
                    isBooked: true,
                    heldByUserId: null,
                    heldTill: null,
                },
            });
            if (count.count !== session.selectedSeats.length) {
                throw new Error(
                    "Some selected seats could not be booked. Please try again."
                );
            }
        }

        // 2. Calculate total amount (fetch price from showtime)
        const showtime = await tx.showtime.findUniqueOrThrow({
            where: { id: session.showtimeId },
            select: {
                price: true,
                startTime: true,
                movie: {
                    select: {
                        title: true,
                        posterUrl: true,
                    },
                },
            },
        });
        // Sorting by persisted showtimeSeat id keeps watch party ticket
        // assignment deterministic across retries and test runs.
        const sortedShowtimeSeatIds = [...session.selectedSeats]
            .map((showtimeSeat: any) => showtimeSeat.id)
            .sort((a: string, b: string) => a.localeCompare(b));
        const showtimeSeats = await tx.showtimeSeat.findMany({
            where: {
                id: { in: sortedShowtimeSeatIds },
            },
            select: {
                id: true,
                seat: {
                    select: {
                        row: true,
                        number: true,
                    },
                },
            },
        });
        const seatLabelByShowtimeSeatId = new Map(
            showtimeSeats.map((showtimeSeat) => [
                showtimeSeat.id,
                // Seat labels are precomputed once so both booking branches can
                // build email payloads without duplicating formatting logic.
                formatSeatFromCode(
                    showtimeSeat.seat.row,
                    showtimeSeat.seat.number
                ),
            ])
        );
        const showDate = formatShowtimeDate(showtime.startTime);
        const showTime = formatShowtimeTime(showtime.startTime);

        if (session.watchPartyId) {
            const watchParty = await tx.watchParty.findUnique({
                where: { id: session.watchPartyId },
                select: {
                    hostUserId: true,
                    participants: {
                        select: { id: true },
                        orderBy: [
                            { firstName: "asc" },
                            { lastName: "asc" },
                            { email: "asc" },
                        ],
                    },
                },
            });

            if (!watchParty?.hostUserId) {
                throw new Error(
                    "Watch party host is missing. Unable to complete booking."
                );
            }

            const memberUserIds = [
                watchParty.hostUserId,
                ...watchParty.participants.map((participant) => participant.id),
            ];

            const uniqueMemberUserIds = [...new Set(memberUserIds)];
            const memberUsers = await tx.user.findMany({
                where: { id: { in: uniqueMemberUserIds } },
                select: {
                    id: true,
                    email: true,
                    cardNumber: true,
                },
            });
            const memberUserById = new Map(
                memberUsers.map((member) => [member.id, member])
            );
            if (uniqueMemberUserIds.length !== sortedShowtimeSeatIds.length) {
                throw new Error(
                    "Watch party member count does not match selected seat count."
                );
            }

            // Deterministic host-first ordering avoids reshuffling seat ownership
            // if the completion step is retried after a transient failure.
            for (const [index, memberUserId] of uniqueMemberUserIds.entries()) {
                const showtimeSeatId = sortedShowtimeSeatIds[index];

                if (!memberUserId || !showtimeSeatId) {
                    throw new Error(
                        "Watch party booking data is incomplete. Please try again."
                    );
                }

                const booking = await tx.booking.create({
                    data: {
                        // Each member gets an individual booking record even
                        // though the host coordinates the overall flow.
                        totalAmount: showtime.price,
                        status: BookingStatus.CONFIRMED,
                        userId: memberUserId,
                        showtimeId: session.showtimeId,
                        watchPartyId: session.watchPartyId,
                    },
                });
                const memberUser = memberUserById.get(memberUserId);
                const seatLabel = seatLabelByShowtimeSeatId.get(showtimeSeatId);

                if (
                    memberUser?.email &&
                    seatLabel &&
                    showtime.movie.posterUrl
                ) {
                    confirmationEmails.push({
                        userEmail: memberUser.email,
                        movieTitle: showtime.movie.title,
                        posterUrl: showtime.movie.posterUrl,
                        showDate,
                        showTime,
                        seatLabelList: [seatLabel],
                        totalPrice: formatCad(Number(showtime.price)),
                        bookingId: formatBookingNumber(booking.bookingNumber),
                        paymentMethod: maskCardNumber(memberUser.cardNumber),
                        paymentDateTime: formatPaymentDateTime(
                            booking.createdAt
                        ),
                    });
                }

                await tx.ticket.create({
                    data: {
                        bookingId: booking.id,
                        showtimeSeatId,
                        price: showtime.price,
                        status: TicketStatus.VALID,
                    },
                });
            }
        } else {
            // Standard bookings keep all selected seats under one booking.
            const totalAmount = showtime.price.mul(
                session.selectedSeats.length
            );

            // 3. Create booking
            const booking = await tx.booking.create({
                data: {
                    totalAmount,
                    status: BookingStatus.CONFIRMED,
                    userId: session.userId,
                    showtimeId: session.showtimeId,
                },
            });
            const user = await tx.user.findUnique({
                where: {
                    id: session.userId,
                },
                select: {
                    email: true,
                    cardNumber: true,
                },
            });
            if (user?.email && showtime.movie.posterUrl) {
                confirmationEmails.push({
                    userEmail: user.email,
                    movieTitle: showtime.movie.title,
                    posterUrl: showtime.movie.posterUrl,
                    showDate,
                    showTime,
                    seatLabelList: sortedShowtimeSeatIds
                        .map((showtimeSeatId: string) =>
                            seatLabelByShowtimeSeatId.get(showtimeSeatId)
                        )
                        .filter((label): label is string => Boolean(label)),
                    totalPrice: formatCad(Number(totalAmount)),
                    bookingId: formatBookingNumber(booking.bookingNumber),
                    paymentMethod: maskCardNumber(user.cardNumber),
                    paymentDateTime: formatPaymentDateTime(booking.createdAt),
                });
            }

            // 4. Create tickets
            await Promise.all(
                sortedShowtimeSeatIds.map((showtimeSeatId: string) =>
                    tx.ticket.create({
                        data: {
                            bookingId: booking.id,
                            showtimeSeatId,
                            price: showtime.price,
                            status: TicketStatus.VALID,
                        },
                    })
                )
            );
        }

        // 5. Update booking session step
        await tx.bookingSession.update({
            where: { id: session.id },
            data: { step: BookingStep.COMPLETED },
        });

        // Confirmation marks the party as fully booked so dashboards stop
        // presenting it as an open or in-progress group purchase.
        if (session.watchPartyId) {
            await tx.watchParty.update({
                where: { id: session.watchPartyId },
                data: { status: WatchPartyStatus.CONFIRMED },
            });
        }
    });

    await sendBookingConfirmationEmails(confirmationEmails);
}

/**
 * Sends confirmation emails after the transaction commits so booking creation
 * is never rolled back by an email delivery failure.
 */
export async function sendBookingConfirmationEmails(
    confirmationEmails: Array<{
        userEmail: string;
        movieTitle: string;
        posterUrl: string;
        showDate: string;
        showTime: string;
        seatLabelList: string[];
        totalPrice: string;
        bookingId: string;
        paymentMethod: string;
        paymentDateTime: string;
    }>
) {
    const apiKey =
        process.env.LOAD_TEST_MODE === undefined ||
        process.env.LOAD_TEST_MODE === "false"
            ? process.env.RESEND_EMAIL_API_KEY
            : null;
    if (!apiKey || confirmationEmails.length === 0) {
        return;
    }

    const resend = new Resend(apiKey);

    // sends email to all participates
    for (const confirmationEmail of confirmationEmails) {
        try {
            await resend.emails.send({
                from: "Cinemate <do-not-reply@bookcinemate.me>",
                to: confirmationEmail.userEmail,
                subject: "Booking Confirmed! - Cinemate",
                react: TicketConfirmation({
                    movieTitle: confirmationEmail.movieTitle,
                    posterUrl: confirmationEmail.posterUrl,
                    date: confirmationEmail.showDate,
                    time: confirmationEmail.showTime,
                    screen: "#1",
                    seatLabelList: confirmationEmail.seatLabelList,
                    totalPrice: confirmationEmail.totalPrice,
                    bookingId: confirmationEmail.bookingId,
                    paymentMethod: confirmationEmail.paymentMethod,
                    paymentDateTime: confirmationEmail.paymentDateTime,
                }),
            });
        } catch (error) {
            console.error("Failed to send booking confirmation email:", error);
        }
    }
}
