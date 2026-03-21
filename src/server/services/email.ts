import { Resend } from "resend";
import { render } from "@react-email/render";
import { env } from "~/env.mjs";
import WatchPartyInvitation from "~/server/emailTemplates/WatchPartyInvitation";

const resend = new Resend(process.env.RESEND_EMAIL_API_KEY ?? "");

export interface SendWatchPartyInviteParams {
    emails: string[];
    hostName: string;
    movieTitle: string;
    moviePosterUrl: string;
    showDate: string;
    showTime: string;
    inviteCode: string;
}

export const sendWatchPartyInvitations = async (
    params: SendWatchPartyInviteParams
) => {
    const watchPartyUrl = new URL("/watch-party", env.APP_BASE_URL).toString();
    const signUpUrl = new URL("/auth/sign-up", env.APP_BASE_URL).toString();

    const emailHtml = await render(
        WatchPartyInvitation({
            ...params,
            watchPartyUrl,
            signUpUrl,
        })
    );

    return Promise.all(
        params.emails.map((email) =>
            resend.emails.send({
                from: "Cinemate <no-reply@bookcinemate.me>",
                to: email,
                subject: `${params.hostName} invited you to a Watch Party! 🍿`,
                html: emailHtml,
            })
        )
    );
};
