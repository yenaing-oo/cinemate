"use client";

import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";

interface DatePillProps {
  label: string;
  value: string;
}

export function DatePill({ label, value }: DatePillProps) {
  return (
    <Link href={`/movies?date=${encodeURIComponent(value)}`} className="block">
      <Card className="lift-card border-border/60 bg-card/60 hover:bg-card/80 border transition">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            {label}
          </p>
          <p className="font-semibold">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
