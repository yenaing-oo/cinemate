"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AuthButton } from "~/app/components/AuthButton";
import { HamburgerMenuIcon, Cross1Icon } from "@radix-ui/react-icons";

export default function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={menuRef} className="md:hidden">
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                className="text-foreground flex items-center justify-center rounded-lg p-2 transition hover:bg-white/10"
            >
                {isOpen ? (
                    <Cross1Icon className="h-5 w-5" />
                ) : (
                    <HamburgerMenuIcon className="h-5 w-5" />
                )}
            </button>

            {/* Mobile Dropdown Panel */}
            {isOpen && (
                <div className="glass-panel absolute top-full right-0 left-0 mt-2 rounded-2xl px-4 py-4 md:hidden">
                    <nav className="flex flex-col items-end gap-4 font-medium">
                        <Link
                            href="/movies"
                            onClick={() => setIsOpen(false)}
                            className="text-muted-foreground hover:text-foreground transition"
                        >
                            Movies
                        </Link>
                        <Link
                            href="/watch-party"
                            onClick={() => setIsOpen(false)}
                            className="text-muted-foreground hover:text-foreground transition"
                        >
                            Watch Party
                        </Link>
                        <Link
                            href="/bookings"
                            onClick={() => setIsOpen(false)}
                            className="text-muted-foreground hover:text-foreground transition"
                        >
                            Bookings
                        </Link>
                        <div
                            className="flex w-full justify-end border-t border-white/10 pt-3"
                            onClick={() => setIsOpen(false)}
                        >
                            <AuthButton />
                        </div>
                    </nav>
                </div>
            )}
        </div>
    );
}
