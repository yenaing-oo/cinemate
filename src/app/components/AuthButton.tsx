"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { Button } from "~/components/ui/button";
import { LogoutButton } from "~/components/logout-button";
import { useAuthSession } from "~/lib/hooks/use-auth-session";
import { cn } from "~/lib/utils";

type AuthButtonProps = {
    onNavigate?: () => void;
};

const PROFILE_THEMES = [
    {
        shell: "linear-gradient(135deg, rgba(91, 103, 191, 0.3), rgba(47, 61, 126, 0.22))",
        shellBorder: "rgba(149, 165, 255, 0.34)",
        avatar: "linear-gradient(135deg, #7c8cff, #4657c6)",
        avatarBorder: "rgba(219, 226, 255, 0.24)",
        avatarText: "#f7f9ff",
        iconShell:
            "linear-gradient(135deg, rgba(124, 140, 255, 0.24), rgba(70, 87, 198, 0.12))",
        iconColor: "#dfe5ff",
    },
    {
        shell: "linear-gradient(135deg, rgba(38, 126, 154, 0.3), rgba(20, 71, 89, 0.22))",
        shellBorder: "rgba(105, 204, 230, 0.32)",
        avatar: "linear-gradient(135deg, #40c3dd, #1f7d92)",
        avatarBorder: "rgba(214, 247, 255, 0.22)",
        avatarText: "#f3fdff",
        iconShell:
            "linear-gradient(135deg, rgba(64, 195, 221, 0.24), rgba(31, 125, 146, 0.12))",
        iconColor: "#dbfbff",
    },
    {
        shell: "linear-gradient(135deg, rgba(142, 92, 39, 0.3), rgba(89, 50, 15, 0.22))",
        shellBorder: "rgba(239, 188, 112, 0.34)",
        avatar: "linear-gradient(135deg, #e7b15e, #aa6d27)",
        avatarBorder: "rgba(255, 242, 214, 0.2)",
        avatarText: "#fff9ef",
        iconShell:
            "linear-gradient(135deg, rgba(231, 177, 94, 0.24), rgba(170, 109, 39, 0.12))",
        iconColor: "#ffefcb",
    },
    {
        shell: "linear-gradient(135deg, rgba(60, 126, 93, 0.28), rgba(33, 74, 53, 0.22))",
        shellBorder: "rgba(118, 213, 165, 0.3)",
        avatar: "linear-gradient(135deg, #62d49b, #317550)",
        avatarBorder: "rgba(227, 255, 241, 0.2)",
        avatarText: "#f4fff9",
        iconShell:
            "linear-gradient(135deg, rgba(98, 212, 155, 0.24), rgba(49, 117, 80, 0.12))",
        iconColor: "#dbffe9",
    },
    {
        shell: "linear-gradient(135deg, rgba(155, 77, 119, 0.28), rgba(90, 38, 67, 0.22))",
        shellBorder: "rgba(231, 137, 184, 0.3)",
        avatar: "linear-gradient(135deg, #de78ad, #8d4168)",
        avatarBorder: "rgba(255, 229, 241, 0.2)",
        avatarText: "#fff6fa",
        iconShell:
            "linear-gradient(135deg, rgba(222, 120, 173, 0.24), rgba(141, 65, 104, 0.12))",
        iconColor: "#ffe1ee",
    },
    {
        shell: "linear-gradient(135deg, rgba(100, 85, 164, 0.3), rgba(55, 45, 102, 0.22))",
        shellBorder: "rgba(180, 166, 255, 0.32)",
        avatar: "linear-gradient(135deg, #9a86ef, #5944a8)",
        avatarBorder: "rgba(239, 235, 255, 0.22)",
        avatarText: "#f8f6ff",
        iconShell:
            "linear-gradient(135deg, rgba(154, 134, 239, 0.24), rgba(89, 68, 168, 0.12))",
        iconColor: "#e8e2ff",
    },
];

function readMetadataValue(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function toTitleCase(value: string) {
    return value
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function getUserName(user: User) {
    // Use the saved name first. Fall back to the email when it is missing.
    const firstName = readMetadataValue(user.user_metadata?.first_name);
    const lastName = readMetadataValue(user.user_metadata?.last_name);
    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName) {
        return fullName;
    }

    const metadataName =
        readMetadataValue(user.user_metadata?.full_name) ||
        readMetadataValue(user.user_metadata?.name);

    if (metadataName) {
        return metadataName;
    }

    const emailPrefix = user.email?.split("@")[0] ?? "";
    const cleanEmailName = emailPrefix.replace(/[._-]+/g, " ").trim();

    if (cleanEmailName) {
        return toTitleCase(cleanEmailName);
    }

    return "Account";
}

function getUserInitials(name: string, email?: string) {
    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
        return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
    }

    if (parts.length === 1 && parts[0]) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (email ?? "U").slice(0, 2).toUpperCase();
}

function getProfileTheme(seed: string) {
    let hash = 0;

    for (const char of seed) {
        hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }

    const fallbackTheme = PROFILE_THEMES[0];

    if (!fallbackTheme) {
        throw new Error("Profile themes are not configured.");
    }

    return PROFILE_THEMES[hash % PROFILE_THEMES.length] ?? fallbackTheme;
}

export function AuthButton({ onNavigate }: AuthButtonProps) {
    const { user, isLoading } = useAuthSession();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const menuRef = useRef<HTMLDivElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const currentSearch = searchParams.toString();
    const currentPath = `${pathname}${currentSearch ? `?${currentSearch}` : ""}`;
    const signInHref = pathname.startsWith("/auth")
        ? "/auth/login"
        : `/auth/login?next=${encodeURIComponent(currentPath)}`;

    const userName = user ? getUserName(user) : "";
    const userEmail = user?.email ?? "";
    const userInitials = getUserInitials(userName, userEmail);
    const profileTheme = getProfileTheme(userEmail || userName || userInitials);

    useEffect(() => {
        if (!isMenuOpen) {
            return;
        }

        // Close the menu when the user clicks away or presses Escape.
        const handlePointerDown = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMenuOpen]);

    if (isLoading) {
        return null;
    }

    if (!user) {
        return (
            <Button asChild>
                <Link href={signInHref} onClick={onNavigate}>
                    Sign in
                </Link>
            </Button>
        );
    }

    return (
        <div ref={menuRef} className="relative">
            <Button
                type="button"
                variant="ghost"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label="Open user menu"
                className="h-11 rounded-full border px-2.5 shadow-[0_14px_32px_rgba(2,6,23,0.34)] transition-transform hover:-translate-y-0.5"
                style={{
                    backgroundColor: "rgba(11, 16, 26, 0.94)",
                    backgroundImage: profileTheme.shell,
                    borderColor: profileTheme.shellBorder,
                }}
                onClick={() => setIsMenuOpen((prev) => !prev)}
            >
                <span
                    className="flex size-8 items-center justify-center rounded-full border text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                    style={{
                        background: profileTheme.avatar,
                        borderColor: profileTheme.avatarBorder,
                        color: profileTheme.avatarText,
                    }}
                >
                    {userInitials}
                </span>
                <ChevronDown
                    className={cn(
                        "size-4 text-slate-200 transition-transform",
                        isMenuOpen && "rotate-180"
                    )}
                />
            </Button>

            {isMenuOpen ? (
                <div
                    role="menu"
                    aria-label="User menu"
                    className="absolute right-0 z-40 mt-3 w-72 rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(9,14,23,0.96),rgba(11,17,27,0.92))] p-4 shadow-[0_28px_60px_rgba(2,6,23,0.52)] backdrop-blur-xl"
                >
                    <div className="rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-start gap-3">
                            <span
                                className="flex size-10 shrink-0 items-center justify-center rounded-full border"
                                style={{
                                    background: profileTheme.iconShell,
                                    borderColor: profileTheme.avatarBorder,
                                    color: profileTheme.iconColor,
                                }}
                            >
                                <UserRound className="size-4" />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">
                                    {userName}
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs break-all">
                                    {userEmail}
                                </p>
                            </div>
                        </div>
                    </div>

                    <LogoutButton
                        role="menuitem"
                        variant="ghost"
                        className="mt-3 w-full justify-start rounded-xl border border-white/12 bg-[linear-gradient(180deg,rgba(191,145,43,0.88),rgba(160,117,25,0.92))] text-white shadow-[0_12px_28px_rgba(120,85,18,0.34)] hover:bg-[linear-gradient(180deg,rgba(204,157,50,0.96),rgba(175,127,28,0.98))]"
                        onLoggedOut={() => {
                            setIsMenuOpen(false);
                            onNavigate?.();
                        }}
                    >
                        <LogOut className="size-4" />
                        Sign out
                    </LogoutButton>
                </div>
            ) : null}
        </div>
    );
}
