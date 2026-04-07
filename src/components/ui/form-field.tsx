// Small wrapper for form labels, errors, and field layout.
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { Label } from "~/components/ui/label";

interface FormFieldProps {
    id: string;
    label: string;
    children: ReactNode;
    description?: string;
    error?: string;
    className?: string;
}

export function FormField({
    id,
    label,
    children,
    description,
    error,
    className,
}: FormFieldProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label htmlFor={id} className="text-xs tracking-[0.2em] uppercase">
                {label}
            </Label>
            {children}
            {description ? (
                <p className="text-muted-foreground text-xs">{description}</p>
            ) : null}
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
    );
}
