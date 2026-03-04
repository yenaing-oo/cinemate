import { cn } from "~/lib/utils";

interface CheckoutMetricCardProps {
    label: string;
    value: string;
    className?: string;
}

export function CheckoutMetricCard({
    label,
    value,
    className,
}: CheckoutMetricCardProps) {
    return (
        <div
            className={cn(
                "glass-card rounded-2xl border border-white/10 p-5",
                className
            )}
        >
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
    );
}
