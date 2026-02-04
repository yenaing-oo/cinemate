"use client";

import { api } from "~/trpc/react";

export function Greeting() {
    const [hello] = api.example.hello.useSuspenseQuery({ text: "from tRPC" });

    return (
        <div className="w-full max-w-xs">
            <p className="truncate">{hello.greeting}</p>
        </div>
    );
}
