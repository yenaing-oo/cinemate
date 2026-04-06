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

                // Mark the watch party as CLOSED when starting a booking session
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

export async function setTicketCount(
    db: PrismaClient,
    ticketCount: number,
    showtimeId: string,
    userId: string,
    bookingSessionId: string,
    now: Date
) {
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

export async function reserveSeats(
    db: PrismaClient,
    showtimeId: string,
    seatIds: string[],
    userId: string,
    bookingSessionId: string,
    now: Date
) {
    await db.$transaction(async (tx) => {
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
                step: BookingStep.CHECKOUT,
                selectedSeats: {
                    connect: showtimeSeatIds.map((s) => ({ id: s.id })),
                },
            },
        });
    });
}

export async function goBackToSeatSelection(
    db: PrismaClient,
    session: {
        id: string;
        selectedSeats: { id: string }[];
    }
) {
    await db.$transaction(async (tx) => {
        if (session.selectedSeats.length > 0) {
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

            for (const [index, memberUserId] of uniqueMemberUserIds.entries()) {
                const showtimeSeatId = sortedShowtimeSeatIds[index];

                if (!memberUserId || !showtimeSeatId) {
                    throw new Error(
                        "Watch party booking data is incomplete. Please try again."
                    );
                }

                const booking = await tx.booking.create({
                    data: {
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

        // 6. If this is a watch party booking, mark the party as CONFIRMED
        if (session.watchPartyId) {
            await tx.watchParty.update({
                where: { id: session.watchPartyId },
                data: { status: WatchPartyStatus.CONFIRMED },
            });
        }
    });

    await sendBookingConfirmationEmails(confirmationEmails);
}

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
    const apiKey = process.env.RESEND_EMAIL_API_KEY;
    if (!apiKey || confirmationEmails.length === 0) {
        return;
    }

    const resend = new Resend(apiKey);

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
