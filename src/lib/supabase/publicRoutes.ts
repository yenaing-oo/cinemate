// Centralized config for public routes
export const PUBLIC_ROUTES = ["/"];

export const PUBLIC_PREFIXES = ["/auth", "/movies", "/api"];

const PRIVATE_ROUTE_PATTERNS = [/^\/movies\/[^/]+\/showtimes(?:\/.*)?$/];

export function isPublicRoute(pathname: string): boolean {
    if (PRIVATE_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))) {
        return false;
    }

    return (
        PUBLIC_ROUTES.includes(pathname) ||
        PUBLIC_PREFIXES.some(
            (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
        )
    );
}
