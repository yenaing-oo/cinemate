"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function SendEmailButton() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const sendMutation = api.email.send.useMutation();

    async function send() {
        setLoading(true);
        setStatus(null);
        try {
            const res = await sendMutation.mutateAsync({
                recipientEmail: email,
            });

            console.log("response from email: ", res);
            setStatus("Sent");
        } catch (err: unknown) {
            if (err instanceof Error) {
                setStatus(err.message);
            } else if (typeof err === "string") {
                setStatus(err);
            } else {
                setStatus("Failed to send");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="rounded px-3 py-2 text-black"
            />
            <button
                onClick={send}
                disabled={loading || !email}
                className="rounded-full bg-white/10 px-6 py-2 font-semibold hover:bg-white/20 disabled:opacity-50"
            >
                {loading ? "Sending..." : "Send email"}
            </button>
            {status && <p className="text-white">{status}</p>}
        </div>
    );
}

export default SendEmailButton;
