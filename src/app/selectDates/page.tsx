"use client";

import Link from "next/link";

const dates = [
  { label: "Today", value: "Feb 8, 2026" },
  { label: "Tomorrow", value: "Feb 9, 2026" },
  { label: "Tuesday", value: "Feb 10, 2026" },
  { label: "Wednesday", value: "Feb 11, 2026" },
  { label: "Thursday", value: "Feb 12, 2026" },
];

export default function SelectDatePage() {
  return (
    <section className="container py-5 text-white">
      <Link href="/movies" className="text-decoration-none text-white mb-4 d-inline-block">
        ← Back
      </Link>

      <h2 className="fw-bold mb-4">Select date</h2>

      <div className="row g-4">
        {dates.map((d) => (
          <div key={d.value} className="col-md-4">
            <Link
              href={`/movies?date=${encodeURIComponent(d.value)}`}
              className="d-block rounded-4 p-4 text-decoration-none text-white"
              style={{
                background:
                  "linear-gradient(180deg, rgba(18,36,64,0.85), rgba(10,20,36,0.85))",
                border: "1px solid rgba(120,200,255,0.25)",
              }}
            >
              <div className="fw-semibold">{d.label}</div>
              <div className="opacity-75">{d.value}</div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
