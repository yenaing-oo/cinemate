"use client";

import { useRouter } from "next/navigation";

interface DatePillProps {
  label: string;
  value: string;
  date: string; // YYYY-MM-DD
}

export function DatePill({ label, value, date }: DatePillProps) {

  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/showtimes?date=${date}`)}
      className="
        border border-border/60
        bg-card/60
        rounded-xl
        px-6 py-4
        text-left
        hover:bg-card/80
        transition
      "
    >
      <div className="font-semibold">
        {label}
      </div>

      <div className="text-muted-foreground text-sm">
        {value}
      </div>

    </button>
  );
}
