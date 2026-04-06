import React from "react";
import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Row,
    Column,
    Text,
    Img,
} from "@react-email/components";

import { styles } from "./TicketConfirmationStyle";

type Props = {
    movieTitle: string;
    posterUrl: string;
    date: string;
    time: string;
    screen: string;
    seatLabelList: string[];
    totalPrice: string;
    bookingId: string;
    paymentMethod?: string;
    paymentDateTime?: string;
};

export default function TicketConfirmation({
    movieTitle,
    posterUrl,
    date,
    time,
    screen,
    seatLabelList,
    totalPrice,
    bookingId,
    paymentMethod = "Original payment method",
    paymentDateTime,
}: Props) {
    const ticketQrCode =
        "https://www.davidleonard.london/wp-content/uploads/2024/05/FI-QRcode-of-URL.png";
    return (
        <Html>
            <Head />
            <Body style={styles.body}>
                <Container style={styles.container}>
                    {/* Company title */}
                    <Text style={styles.title_header}>Cinemate</Text>

                    <Text style={styles.intro_msg}>
                        You&apos;re all set for the movies! Your booking is
                        confirmed. Keep this email handy to scan at the
                        entrance.
                    </Text>

                    {/* Header */}
                    <Text style={styles.header}>🎬 Booking Details</Text>

                    {/* Movie Details Section */}
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
                                <Text style={styles.movieTitle}>
                                    {movieTitle} <br />
                                </Text>
                                <Text style={styles.subText}>
                                    📅 {date} &nbsp;•&nbsp; ⏰ {time} <br />
                                </Text>
                                <Text style={styles.subText}>
                                    🎥 Screen {screen}
                                </Text>
                            </Column>
                        </Row>
                    </Section>

                    {/* Tickets Section */}
                    <Section>
                        <Text style={styles.header}>
                            🎟 Tickets ({seatLabelList.length})
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
                                                borderRight: "2px dashed #fff",
                                                padding: "5em 0em",
                                            }}
                                        ></Text>
                                    </Column>

                                    <Column
                                        align="center"
                                        style={styles.ticketCard_right}
                                    >
                                        <Img
                                            src={ticketQrCode}
                                            width="110"
                                            style={styles.qr}
                                        />
                                    </Column>
                                </Row>
                            </Section>
                        ))}
                    </Section>

                    {/* Payment Section */}
                    <Section style={styles.paymentCard}>
                        <Text style={styles.sectionTitle}>
                            💳 Payment Summary
                        </Text>

                        <Row>
                            <Column>
                                <Text style={styles.paymentLabel}>
                                    Booking ID
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={styles.paymentValue}>
                                    {bookingId}
                                </Text>
                            </Column>
                        </Row>

                        <Row>
                            <Column>
                                <Text style={styles.paymentLabel}>Tickets</Text>
                            </Column>
                            <Column align="right">
                                <Text style={styles.paymentValue}>
                                    {seatLabelList.length}
                                </Text>
                            </Column>
                        </Row>

                        <Row>
                            <Column>
                                <Text style={styles.paymentLabel}>
                                    Payment Method
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={styles.paymentValue}>
                                    {paymentMethod}
                                </Text>
                            </Column>
                        </Row>

                        {paymentDateTime ? (
                            <Row>
                                <Column>
                                    <Text style={styles.paymentLabel}>
                                        Paid At
                                    </Text>
                                </Column>
                                <Column align="right">
                                    <Text style={styles.paymentValue}>
                                        {paymentDateTime}
                                    </Text>
                                </Column>
                            </Row>
                        ) : null}

                        <Section style={styles.divider} />

                        <Row>
                            <Column>
                                <Text style={styles.totalLabel}>
                                    Total Paid
                                </Text>
                            </Column>
                            <Column align="right">
                                <Text style={styles.totalValue}>
                                    {totalPrice}
                                </Text>
                            </Column>
                        </Row>
                    </Section>

                    {/* Footer */}
                    <Text style={styles.footer}>
                        Please arrive 15 minutes early and present your QR code
                        at entry.
                        <br />
                        Enjoy the show 🍿
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}
