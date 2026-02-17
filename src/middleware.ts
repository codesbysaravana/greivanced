import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/jwt-edge'

// Inline role values to avoid importing @prisma/client in Edge Runtime
const ROLE_ADMIN = 'ADMIN'
const ROLE_OFFICER = 'OFFICER'
const ROLE_CITIZEN = 'CITIZEN'

const PROTECTED_ROUTES: Record<string, string[]> = {
    '/admin': [ROLE_ADMIN],
    '/officer': [ROLE_OFFICER],
    '/citizen': [ROLE_CITIZEN]
}

function getDashboardPath(role: string): string {
    switch (role) {
        case ROLE_ADMIN: return '/admin/dashboard'
        case ROLE_OFFICER: return '/officer/dashboard'
        case ROLE_CITIZEN: return '/citizen/dashboard'
        default: return '/'
    }
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value
    const { pathname } = request.nextUrl

    // If user is on /login, /register, or landing page — check if they're already logged in
    if (pathname === '/login' || pathname === '/register') {
        if (token) {
            const payload = verifyTokenEdge(token)
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
    let requiredRoles: string[] = []
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
        const payload = verifyTokenEdge(token)
        if (!payload) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (!requiredRoles.includes(payload.role)) {
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
