"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "~/lib/utils";

type BackButtonProps = Omit<
    React.ComponentProps<typeof Link>,
    "href" | "children"
> & {
    href: React.ComponentProps<typeof Link>["href"];
    children?: React.ReactNode;
};

export function BackButton({
    href,
    children = "Back",
    className,
    ...props
}: BackButtonProps) {
    return (
        <Link href={href} className={cn("app-back-button", className)} {...props}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            <span>{children}</span>
        </Link>
    );
}
