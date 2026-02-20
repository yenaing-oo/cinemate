"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DatePill } from "~/components/ui/date";
import { api } from "~/trpc/react";

export default function SelectDatePage() {
    const { data: dates, isLoading } =
        api.showtime.getAvailableDates.useQuery();

    const { todayString, tomorrowString } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        return {
            todayString: today.toDateString(),
            tomorrowString: tomorrow.toDateString(),
        };
    }, []);

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
                    const jsDateString = jsDate.toDateString();

                    const label =
                        jsDateString === todayString
                            ? "Today"
                            : jsDateString === tomorrowString
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
