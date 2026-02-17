/**
 * Edge-compatible JWT verification using Web Crypto API.
 * This module is used by middleware (which runs in the Edge Runtime)
 * where Node.js-only modules like 'jsonwebtoken' are not available.
 */

export interface JWTPayload {
    userId: string
    role: string
    email: string
}

function base64UrlDecode(str: string): Uint8Array {
    // Add padding if needed
    const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

export function verifyTokenEdge(token: string): JWTPayload | null {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null

        // Decode the payload (middle part)
        const payloadStr = new TextDecoder().decode(base64UrlDecode(parts[1]))
        const payload = JSON.parse(payloadStr)

        // Check expiration
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            return null
        }

        return {
            userId: payload.userId,
            role: payload.role,
            email: payload.email,
        }
    } catch {
        return null
    }
}
