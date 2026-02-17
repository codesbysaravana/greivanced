import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod'
const EXPIRES_IN = '7d'

export interface JWTPayload {
    userId: string
    role: string
    email: string
}

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload
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
        maxAge: 7 * 24 * 60 * 60, // 7 days
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
