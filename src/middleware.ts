import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { Role } from '@prisma/client'

const PROTECTED_ROUTES: Record<string, Role[]> = {
    '/admin': [Role.ADMIN],
    '/officer': [Role.OFFICER],
    '/citizen': [Role.CITIZEN]
}

function getDashboardPath(role: string): string {
    switch (role) {
        case Role.ADMIN: return '/admin/dashboard'
        case Role.OFFICER: return '/officer/dashboard'
        case Role.CITIZEN: return '/citizen/dashboard'
        default: return '/'
    }
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value
    const { pathname } = request.nextUrl

    // If user is on /login, /register, or landing page — check if they're already logged in
    if (pathname === '/login' || pathname === '/register') {
        if (token) {
            const payload = verifyToken(token)
            if (payload) {
                // Already authenticated — redirect to their dashboard
                return NextResponse.redirect(new URL(getDashboardPath(payload.role), request.url))
            }
        }
        return NextResponse.next()
    }

    // Landing page is always accessible
    if (pathname === '/') {
        return NextResponse.next()
    }

    // Determine which roles are required for this route
    let requiredRoles: Role[] = []
    if (pathname.startsWith('/admin')) requiredRoles = PROTECTED_ROUTES['/admin']
    else if (pathname.startsWith('/officer')) requiredRoles = PROTECTED_ROUTES['/officer']
    else if (pathname.startsWith('/citizen')) requiredRoles = PROTECTED_ROUTES['/citizen']

    // If no protected route matched, allow access
    if (requiredRoles.length === 0) {
        return NextResponse.next()
    }

    // No token — redirect to login
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify token and check role
    try {
        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (!requiredRoles.includes(payload.role as Role)) {
            // User is logged in but doesn't have the right role — send to their own dashboard
            return NextResponse.redirect(new URL(getDashboardPath(payload.role), request.url))
        }
        return NextResponse.next()
    } catch {
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
