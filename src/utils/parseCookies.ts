/**
 * Parse cookies from a string into an object.
 * @param cookieHeader The raw cookie header string.
 * @returns An object representing the parsed cookies.
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    const cookiePairs = cookieHeader.split(';');
    cookiePairs.forEach(cookie => {
        const [name, value] = cookie.split('=').map(c => c.trim());
        if (name && value) {
            cookies[name] = value;
        }
    });
    return cookies;
}