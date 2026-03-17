import { api } from "~/trpc/react";

interface SendEmailProps {
    userId: string | null;
    movieTitle: string;
    moviePosterUrl: string | null;
    showDate: string;
    showTime: string;
    seatLabelList: string[];
    totalPrice: string;
    bookingId: string;
}

export function useSendConfirmationEmail() {
    const sendMutation = api.email.sendConfirmation.useMutation();

    return async (data: SendEmailProps) => {
        if (!data.userId || !data.moviePosterUrl) return;

        return sendMutation.mutateAsync({
            userId: data.userId,
            movieTitle: data.movieTitle,
            moviePosterUrl: data.moviePosterUrl,
            showDate: data.showDate,
            showTime: data.showTime,
            seatLabelList: data.seatLabelList,
            totalPrice: data.totalPrice,
            bookingId: data.bookingId,
        });
    };
}
