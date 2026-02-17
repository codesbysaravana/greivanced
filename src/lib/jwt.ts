import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import * as jose from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod'
const EXPIRES_IN = '7d'

// Convert secret for jose (Edge compatible)
const JWT_SECRET_UINT8 = new TextEncoder().encode(JWT_SECRET)

export interface JWTPayload {
    userId: string
    role: string
    email: string
}

/**
 * Standard Node.js JWT signing (used in Server Actions)
 */
export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN })
}

/**
 * Standard Node.js JWT verify (used in Server Actions)
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch {
        return null
    }
}

/**
 * Edge-compatible JWT verify (used in Middleware)
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jose.jwtVerify(token, JWT_SECRET_UINT8)
        return payload as unknown as JWTPayload
    } catch {
        return null
    }
}

export async function setAuthCookie(token: string) {
    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
    })
}

export async function clearAuthCookie() {
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')
}

export async function getAuthSession(): Promise<JWTPayload | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return verifyToken(token)
}
