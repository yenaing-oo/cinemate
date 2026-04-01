"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "~/lib/utils";

type BackButtonLinkProps = Omit<
    React.ComponentProps<typeof Link>,
    "href" | "children"
> & {
    href: React.ComponentProps<typeof Link>["href"];
    children?: React.ReactNode;
};

type BackButtonActionProps = Omit<
    React.ComponentProps<"button">,
    "children"
> & {
    href?: never;
    children?: React.ReactNode;
};

type BackButtonProps = BackButtonLinkProps | BackButtonActionProps;

export function BackButton({
    children = "Back",
    className,
    ...props
}: BackButtonProps) {
    const content = (
        <>
            <ArrowLeft aria-hidden="true" className="size-4" />
            <span>{children}</span>
        </>
    );

    if ("href" in props && props.href !== undefined) {
        const { href, ...linkProps } = props;

        return (
            <Link
                href={href}
                className={cn("app-back-button", className)}
                {...linkProps}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            className={cn("app-back-button", className)}
            {...props}
        >
            {content}
        </button>
    );
}
