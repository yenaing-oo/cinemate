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
} from '@react-email/components';

import { styles } from './TicketConfirmationStyle';

type Ticket = {
  seatNumber: string;
  qrCodeUrl: string;
};

type Props = {
  movieTitle: string;
  posterUrl: string;
  date: string;
  time: string;
  screen: string;
  tickets: Ticket[];
  totalPrice: string;
  bookingId: string;
};

export default function TicketConfirmation({
  movieTitle,
  posterUrl,
  date,
  time,
  screen,
  tickets,
  totalPrice,
  bookingId,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Company title */}
          <Text style={styles.title_header}>Cinemate</Text>

          <Text style={styles.intro_msg}>You&apos;re all set for the movies! Your booking is confirmed. Keep this email handy to scan at the entrance.</Text>

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
                <Text style={styles.movieTitle}>{movieTitle} <br /></Text>
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
              🎟 Tickets ({tickets.length})
            </Text>

            {tickets.map((ticket, index) => (
              <Section key={index} style={styles.ticketCard}>
                <Row>
                  <Column style={styles.ticketCard_left}>
                    <Text style={styles.ticketMovie}>{movieTitle}</Text>
                    <Text style={styles.ticketText}>
                      {date} • {time}
                    </Text>
                    <Text style={styles.seatText}>
                      Seat: {ticket.seatNumber}
                    </Text>
                  </Column>

                  <Column style={{ backgroundColor: '#0f172a' }}>
                    <Text style={{ borderRight: '2px dashed #fff', padding: '5em 0em' }}></Text>
                  </Column>

                  <Column align="center" style={styles.ticketCard_right}>
                    <Img
                      src={ticket.qrCodeUrl}
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
            <Text style={styles.sectionTitle}>💳 Payment Summary</Text>

            <Row>
              <Column>
                <Text style={styles.paymentLabel}>Booking ID</Text>
              </Column>
              <Column align="right">
                <Text style={styles.paymentValue}>{bookingId}</Text>
              </Column>
            </Row>

            <Row>
              <Column>
                <Text style={styles.paymentLabel}>Tickets</Text>
              </Column>
              <Column align="right">
                <Text style={styles.paymentValue}>
                  {tickets.length}
                </Text>
              </Column>
            </Row>

            <Row>
              <Column>
                <Text style={styles.totalLabel}>Total Paid</Text>
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
            Please arrive 15 minutes early and present your QR code at entry.
            <br />
            Enjoy the show 🍿
          </Text>

        </Container>
      </Body>
    </Html>
  );
}