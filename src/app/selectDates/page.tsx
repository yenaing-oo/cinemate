"use client";

import Link from "next/link";
import { DatePill } from "~/components/ui/date";
const dates = [
  { label: "Today", value: "Feb 8, 2026" },
  { label: "Tomorrow", value: "Feb 9, 2026" },
  { label: "Tuesday", value: "Feb 10, 2026" },
  { label: "Wednesday", value: "Feb 11, 2026" },
  { label: "Thursday", value: "Feb 12, 2026" },
];

export default function SelectDatePage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <Link
        href="/movies"
        className="text-muted-foreground hover:text-foreground mb-8 inline-block transition"
      >
        ← Back
      </Link>

      <h2 className="text-3xl font-bold mb-10">Select Date</h2>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {dates.map((d) => (
          <DatePill key={d.value} label={d.label} value={d.value} />
        ))}
      </div>
    </section>
  );
}
