import { headers } from "next/headers";

/**
 * Validates that the request's Origin header matches the Host header.
 * This is used to prevent CSRF attacks on Server Actions.
 */
export async function validateRequestOrigin(): Promise<boolean> {
    const headersList = await headers();
    const origin = headersList.get("origin");
    const host = headersList.get("host");

    // Server Actions are invoked via POST, so Origin should be present.
    if (!origin || !host) {
        return false;
    }

    try {
        const originUrl = new URL(origin);
        // Compare host from Origin with Host header.
        // originUrl.host includes hostname and port (e.g. localhost:3000)
        // Host header also includes hostname and port.
        return originUrl.host === host;
    } catch (error) {
        console.error("Error validating origin:", error);
        return false;
    }
}
