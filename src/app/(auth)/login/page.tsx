'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../auth.module.css'
import { login } from '@/actions/auth'

const initialState = {
    error: '',
}

export default function LoginPage() {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(login, initialState)
    const [isRedirecting, setIsRedirecting] = useState(false)

    useEffect(() => {
        if (state?.success && state?.redirectPath && !isRedirecting) {
            console.log('Login successful, redirecting to:', state.redirectPath)
            setIsRedirecting(true)
            // Small delay to ensure cookie is set before redirect
            // Use window.location for a full page reload to ensure cookie is available
            const redirectPath = state.redirectPath
            setTimeout(() => {
                window.location.href = redirectPath
            }, 100)
        } else if (state?.error) {
            console.error('Login error:', state.error)
        }
    }, [state, isRedirecting])

    return (
        <div>
            <h1 className={styles.title}>Welcome Back</h1>

            {state?.error && <div className={styles.error}>{state.error}</div>}

            <form action={formAction} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className={styles.input}
                        placeholder="citizen@example.com"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>Password</label>
                    <input
                        id="password"
                        name="password" 
                        type="password"
                        required
                        className={styles.input}
                        placeholder="••••••••"
                    />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isPending}>
                    {isPending ? 'Logging in...' : 'Sign In'}
                </button>
            </form>

            <div className={styles.footer}>
                Don&apos;t have an account?{' '}
                <Link href="/register" className={styles.link}>
                    Register here
                </Link>
            </div>
        </div>
    )
}
