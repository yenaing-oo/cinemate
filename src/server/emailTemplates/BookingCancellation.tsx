import {
    Body,
    Column,
    Container,
    Head,
    Html,
    Img,
    Row,
    Section,
    Text,
} from "@react-email/components";
import React from "react";

import { styles } from "./BookingCancellationStyle";

interface Props {
    movieTitle: string;
    posterUrl: string;
    date: string;
    time: string;
    screen: string;
    seatLabelList: string[];
    refundAmount: string;
    bookingId: string;
    refundMethod?: string;
    refundEta?: string;
    paymentMethod?: string;
    refundDateTime?: string;
}

export default function BookingCancellation({
    movieTitle,
    posterUrl,
    date,
    time,
    screen,
    seatLabelList,
    refundAmount,
    bookingId,
    refundMethod = "Original payment method",
    refundEta = "5-7 business days",
    paymentMethod = "Original payment method",
    refundDateTime,
}: Props) {
    return (
        <Html>
            <Head />
            <Body style={styles.body}>
                <Container style={styles.container}>
                    {/* Company title */}
                    <Text style={styles.title_header}>Cinemate</Text>

                    <Text style={styles.intro_msg}>
                        Your booking has been successfully cancelled. We&apos;re
                        sorry to see you go — hopefully we&apos;ll catch you at
                        the movies another time!
                    </Text>

                    {/* Cancelled Movie Details */}
                    <Text style={styles.header}>🎬 Cancelled Booking</Text>

                    <Section style={styles.movieCard}>
                        <Row>
                            <Column width="120">
                                <Img
                                    src={posterUrl}
                                    width="100"
                                    style={styles.poster}
                                />
                            </Column>

                            <Column>
                                <Text style={styles.cancelledBadge}>
                                    Cancelled
                                </Text>
                                <Text style={styles.movieTitle}>
                                    {movieTitle}
                                </Text>
                                <Text style={styles.subText}>
                                    📅 {date} &nbsp;•&nbsp; ⏰ {time}
                                </Text>
                                <Text style={styles.subText}>
                                    🎥 Screen {screen}
                                </Text>
                            </Column>
                        </Row>
                    </Section>

                    {/* Cancelled Tickets */}
                    <Section>
                        <Text style={styles.header}>
                            🎟 Cancelled Tickets ({seatLabelList.length})
                        </Text>

                        {seatLabelList.map((seatLabel, index) => (
                            <Section key={index} style={styles.ticketCard}>
                                <Row>
                                    <Column style={styles.ticketCard_left}>
                                        <Text style={styles.ticketMovie}>
                                            {movieTitle}
                                        </Text>
                                        <Text style={styles.ticketText}>
                                            {date} • {time}
                                        </Text>
                                        <Text style={styles.seatText}>
                                            Seat: {seatLabel}
                                        </Text>
                                    </Column>

                                    <Column
                                        style={{ backgroundColor: "#0f172a" }}
                                    >
                                        <Text
                                            style={{
                                                borderRight:
                                                    "2px dashed #edf2f7",
                                                padding: "5em 0em",
                                            }}
                                        ></Text>
                                    </Column>

                                    <Column
                                        align="center"
                                        style={styles.ticketCard_right}
                                    >
                                        <Text style={styles.cancelledStamp}>
                                            VOID
                                        </Text>
                                    </Column>
                                </Row>
                            </Section>
                        ))}
                    </Section>

                    {/* Refund Summary */}
                    <Section style={styles.refundCard}>
                        <Text style={styles.sectionTitle}>
                            💰 Refund Summary
                        </Text>

                        <Row>
                            <Column>
                                <Text style={styles.refundLabel}>
                                    Booking ID
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={styles.refundValue}>
                                    {bookingId}
                                </Text>
                            </Column>
                        </Row>

                        <Row>
                            <Column>
                                <Text style={styles.refundLabel}>
                                    Tickets Cancelled
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={styles.refundValue}>
                                    {seatLabelList.length}
                                </Text>
                            </Column>
                        </Row>

                        <Row>
                            <Column>
                                <Text style={styles.refundLabel}>
                                    Refund Method
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={styles.refundValue}>
                                    {refundMethod}
                                </Text>
                            </Column>
                        </Row>

                        <Row>
                            <Column>
                                <Text style={styles.refundLabel}>
                                    Original Payment
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={styles.refundValue}>
                                    {paymentMethod}
                                </Text>
                            </Column>
                        </Row>

                        {refundDateTime ? (
                            <Row>
                                <Column>
                                    <Text style={styles.refundLabel}>
                                        Refunded At
                                    </Text>
                                </Column>
                                <Column align="right">
                                    <Text style={styles.refundValue}>
                                        {refundDateTime}
                                    </Text>
                                </Column>
                            </Row>
                        ) : null}

                        <Row>
                            <Column>
                                <Text style={styles.refundLabel}>
                                    Estimated Arrival
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={styles.refundValue}>
                                    {refundEta}
                                </Text>
                            </Column>
                        </Row>

                        <Section style={styles.divider} />

                        <Row>
                            <Column>
                                <Text style={styles.totalLabel}>
                                    Total Refund
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={styles.totalValue}>
                                    {refundAmount}
                                </Text>
                            </Column>
                        </Row>
                    </Section>

                    {/* Footer */}
                    <Text style={styles.footer}>
                        If you did not request this cancellation or have any
                        questions, please contact our support team.
                        <br />
                        We hope to see you at the movies soon 🍿
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}
