// @ts-nocheck
import http from "k6/http";

export function trpcPost(baseUrl, procedurePath, input, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        "x-trpc-source": "k6",
        ...(options.headers ?? {}),
    };

    return http.post(
        `${baseUrl}/api/trpc/${procedurePath}`,
        JSON.stringify({ input }),
        {
            headers,
            tags: options.tags,
        }
    );
}

export function trpcGet(baseUrl, procedurePath, input, options = {}) {
    const headers = {
        "x-trpc-source": "k6",
        ...(options.headers ?? {}),
    };

    const encodedInput = encodeURIComponent(
        JSON.stringify({ json: input ?? {} })
    );

    return http.get(
        `${baseUrl}/api/trpc/${procedurePath}?input=${encodedInput}`,
        {
            headers,
            tags: options.tags,
        }
    );
}
