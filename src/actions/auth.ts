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
    redirectPath?: string
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const data = Object.fromEntries(formData.entries())
    const parsed = loginSchema.safeParse(data)

    if (!parsed.success) {
        console.error('Login validation failed:', parsed.error)
        return { error: 'Invalid email or password format' }
    }

    const { email, password } = parsed.data

    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            console.error('User not found for email:', email)
            return { error: 'Invalid credentials' }
        }

        const isValid = await comparePassword(password, user.passwordHash)
        if (!isValid) {
            console.error('Invalid password for user:', email)
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
        console.log('Login successful for user:', email, 'Role:', user.role)

        // Determine redirect path based on user role
        let redirectPath = '/'
        switch (user.role) {
            case Role.ADMIN: redirectPath = '/admin/dashboard'; break
            case Role.OFFICER: redirectPath = '/officer/dashboard'; break
            case Role.CITIZEN: redirectPath = '/citizen/dashboard'; break
        }

        // Return success with redirect path for client-side navigation
        // redirect() doesn't work well with useActionState, so we handle it client-side
        return { success: true, redirectPath }
    } catch (error) {
        console.error('Login error:', error)
        return { error: error instanceof Error ? error.message : 'Something went wrong' }
    }
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
