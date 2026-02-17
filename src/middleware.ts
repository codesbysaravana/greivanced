import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/jwt'

// Routes that don't need authentication
const PUBLIC_PATHS = ['/login', '/register', '/']
// Role → allowed route prefix mapping
const ROLE_ROUTES: Record<string, string> = {
    ADMIN: '/admin',
    OFFICER: '/officer',
    CITIZEN: '/citizen',
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Get the token from the cookie
    const token = request.cookies.get('auth_token')?.value
    const payload = token ? await verifyTokenEdge(token) : null

    // If user is authenticated and visits public paths, redirect to their dashboard
    if (payload && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
        return NextResponse.redirect(new URL(ROLE_ROUTES[payload.role] + '/dashboard', request.url))
    }

    // Allow public paths, static assets, api routes
    if (
        PUBLIC_PATHS.includes(pathname) ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon')
    ) {
        return NextResponse.next()
    }

    if (!payload) {
        // No token or invalid token → redirect to login
        const loginUrl = new URL('/login', request.url)
        // Only set 'from' if it's a dashboard route, to avoid infinite redirect on login itself
        if (!PUBLIC_PATHS.includes(pathname)) {
            loginUrl.searchParams.set('from', pathname)
        }
        const response = NextResponse.redirect(loginUrl)
        if (token) response.cookies.delete('auth_token')
        return response
    }

    // Check role-based access
    const userRole = payload.role
    const allowedPrefix = ROLE_ROUTES[userRole]

    if (allowedPrefix && pathname.startsWith('/admin') && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL(ROLE_ROUTES[userRole] + '/dashboard', request.url))
    }
    if (allowedPrefix && pathname.startsWith('/officer') && userRole !== 'OFFICER') {
        return NextResponse.redirect(new URL(ROLE_ROUTES[userRole] + '/dashboard', request.url))
    }
    if (allowedPrefix && pathname.startsWith('/citizen') && userRole !== 'CITIZEN') {
        return NextResponse.redirect(new URL(ROLE_ROUTES[userRole] + '/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
