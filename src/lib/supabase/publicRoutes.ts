// Centralized config for public routes
export const PUBLIC_ROUTES = ["/", "/login"];

export const PUBLIC_PREFIXES = ["/auth", "/movies"];

export function isPublicRoute(pathname: string): boolean {
    return (
        PUBLIC_ROUTES.includes(pathname) ||
        PUBLIC_PREFIXES.some(
            (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
        )
    );
}
