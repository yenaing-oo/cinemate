"use client";

import Link from "next/link";
import { DatePill } from "~/components/ui/date";
import { api } from "~/trpc/react";

export default function SelectDatePage() {
    const { data: dates, isLoading } =
        api.showtime.getAvailableDates.useQuery();

    if (isLoading) {
        return (
            <section className="mx-auto max-w-7xl px-6 py-20">
                Loading dates...
            </section>
        );
    }

    if (!dates || dates.length === 0) {
        return (
            <section className="mx-auto max-w-7xl px-6 py-20">
                No dates available.
            </section>
        );
    }

    return (
        <section className="mx-auto max-w-7xl px-6 py-20">
            <Link
                href="/movies"
                className="text-muted-foreground hover:text-foreground mb-8 inline-block transition"
            >
                ← Back
            </Link>

            <h2 className="mb-10 text-3xl font-bold">Select Date</h2>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                {(dates as string[]).map((date) => {
                    const jsDate = new Date(date);

                    const today = new Date();
                    const tomorrow = new Date(Date.now() + 86400000);

                    const label =
                        jsDate.toDateString() === today.toDateString()
                            ? "Today"
                            : jsDate.toDateString() === tomorrow.toDateString()
                              ? "Tomorrow"
                              : jsDate.toLocaleDateString("en-US", {
                                    weekday: "long",
                                });

                    const value = jsDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    });

                    return (
                        <DatePill
                            key={date}
                            label={label}
                            value={value}
                            date={date}
                        />
                    );
                })}
            </div>
        </section>
    );
}
