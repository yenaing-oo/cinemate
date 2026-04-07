// @ts-nocheck
import { trpcPost } from "../../lib/trpc.js";

export function sendConfirmationEmail(baseUrl, sessionId, authHeaders) {
    return trpcPost(
        baseUrl,
        "bookingSession.update",
        {
            sessionId,
            goToStep: "COMPLETED",
        },
        {
            headers: authHeaders,
            tags: {
                area: "booking_complete",
                scenario: "email_confirmation",
                request_type: "write_post",
                endpoint: "bookingSession.update",
            },
        }
    );
}
