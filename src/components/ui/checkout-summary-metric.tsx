// Shows one small number or text value inside the checkout summary.
import { cn } from "~/lib/utils";

interface CheckoutSummaryMetricProps {
    label: string;
    value: string;
    className?: string;
}

export function CheckoutSummaryMetric({
    label,
    value,
    className,
}: CheckoutSummaryMetricProps) {
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
