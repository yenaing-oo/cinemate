"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import * as React from "react";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow hover:opacity-90",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                outline:
                    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                shimmer:
                    "bg-primary text-primary-foreground relative overflow-hidden shadow hover:opacity-90 before:absolute before:inset-0 before:z-0 before:[background:linear-gradient(-75deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.4)_50%,hsl(var(--primary))_100%)] before:opacity-50 before:animate-shimmer-slide",
                glow: "bg-primary text-primary-foreground shadow shadow-primary/50 transition-all duration-300 hover:shadow-primary/80 hover:animate-gradient-x",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3 text-xs",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Component = asChild ? Slot : "button";
        const mouseX = useMotionValue(0);
        const mouseY = useMotionValue(0);

        function handleMouseMove({
            currentTarget,
            clientX,
            clientY,
        }: React.MouseEvent) {
            const { left, top } = currentTarget.getBoundingClientRect();

            mouseX.set(clientX - left);
            mouseY.set(clientY - top);
        }

        const motionStyle = {
            "--x": useMotionTemplate`${mouseX}px`,
            "--y": useMotionTemplate`${mouseY}px`,
        } as React.CSSProperties;

        return (
            <motion.div
                className="relative max-w-fit overflow-hidden"
                style={motionStyle}
                onMouseMove={handleMouseMove}
            >
                <Component
                    className={buttonVariants({ variant, size, className })}
                    ref={ref}
                    // biome-ignore lint/suspicious/noExplicitAny: Motion button requires any for props compatibility
                    {...(props as any)}
                />
            </motion.div>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
