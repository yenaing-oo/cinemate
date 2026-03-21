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

import { styles } from "./WatchPartyInvitationStyle";

type Props = {
    hostName: string;
    movieTitle: string;
    moviePosterUrl: string;
    showDate: string;
    showTime: string;
    inviteCode: string;
    watchPartyUrl: string;
    signUpUrl: string;
};

export default function WatchPartyInvitation({
    hostName,
    movieTitle,
    moviePosterUrl,
    showDate,
    showTime,
    inviteCode,
    watchPartyUrl,
    signUpUrl,
}: Props) {
    return (
        <Html>
            <Head />
            <Body style={styles.body}>
                <Container style={styles.container}>
                    {/* Company title */}
                    <Text style={styles.title_header}>Cinemate</Text>

                    <Text style={styles.intro_msg}>
                        You have been invited by {hostName} to join a Watch
                        Party!
                    </Text>

                    {/* Code Section */}
                    <Section style={styles.codeSection}>
                        <Text style={styles.codeHeader}>YOUR INVITE CODE</Text>
                        <Text style={styles.inviteCode}>{inviteCode}</Text>
                        <Text style={styles.instructions}>
                            Enter this code on the Cinemate app or website to
                            join the party and secure your seat!
                        </Text>
                    </Section>

                    {/* Header */}
                    <Text style={styles.header}>🎬 Watch Party Details</Text>

                    {/* Movie Details Section */}
                    <Section style={styles.movieCard}>
                        <Row>
                            <Column width="120">
                                <Img
                                    src={moviePosterUrl}
                                    width="100"
                                    style={styles.poster}
                                    alt={`${movieTitle} Poster`}
                                />
                            </Column>

                            <Column>
                                <Text style={styles.movieTitle}>
                                    {movieTitle} <br />
                                </Text>
                                <Text style={styles.subText}>
                                    📅 {showDate} &nbsp;•&nbsp; ⏰ {showTime}{" "}
                                    <br />
                                </Text>
                            </Column>
                        </Row>
                    </Section>

                    <Section style={styles.joinSection}>
                        <Text style={styles.joinHeader}>How to join</Text>
                        <Text style={styles.instructions}>
                            1. Go to {watchPartyUrl}.
                            <br />
                            2. Enter your invite code: {inviteCode}.
                            <br />
                            3. If you do not have an account yet, sign up at{" "}
                            {signUpUrl}.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}
