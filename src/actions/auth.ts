'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, comparePassword } from '@/lib/auth'
import { signToken, setAuthCookie, clearAuthCookie } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    aadhaar: z.string().min(12).optional(), // Optional for now, but good to have
})

export type AuthState = {
    error?: string
    success?: boolean
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const data = Object.fromEntries(formData.entries())
    const parsed = loginSchema.safeParse(data)

    if (!parsed.success) {
        return { error: 'Invalid email or password format' }
    }

    const { email, password } = parsed.data

    let redirectPath = '/'

    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return { error: 'Invalid credentials' }
        }

        const isValid = await comparePassword(password, user.passwordHash)
        if (!isValid) {
            return { error: 'Invalid credentials' }
        }

        if (!user.isActive) {
            return { error: 'Account is deactivated' }
        }

        const token = signToken({
            userId: user.id,
            role: user.role,
            email: user.email,
        })

        await setAuthCookie(token)

        // Determine redirect path based on user role
        switch (user.role) {
            case Role.ADMIN: redirectPath = '/admin/dashboard'; break
            case Role.OFFICER: redirectPath = '/officer/dashboard'; break
            case Role.CITIZEN: redirectPath = '/citizen/dashboard'; break
        }
    } catch (error) {
        console.error('Login error:', error)
        return { error: 'Something went wrong' }
    }

    // redirect() throws a NEXT_REDIRECT error internally, so it MUST be
    // called outside the try-catch to avoid being swallowed.
    redirect(redirectPath)
}

export async function register(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const data = Object.fromEntries(formData.entries())
    const parsed = registerSchema.safeParse(data)

    if (!parsed.success) {
        return { error: 'Invalid input data' }
    }

    const { name, email, password, aadhaar } = parsed.data

    try {
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return { error: 'Email already registered' }
        }

        const hashedPassword = await hashPassword(password)

        await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role: Role.CITIZEN, // Default role
                aadhaarHash: aadhaar ? await hashPassword(aadhaar) : null, // Hash Aadhaar too for privacy? Or store plain? Prompt said "Unique Aadhaar hash handled"
                citizenProfile: {
                    create: {
                        fullName: name
                    }
                }
            }
        })

        // Auto login? Or redirect to login?
        // Let's redirect to login for simplicity

    } catch (e) {
        console.error('Registration error:', e)
        return { error: 'Failed to register' }
    }

    redirect('/login')
}

export async function logout() {
    await clearAuthCookie()
    redirect('/login')
}
