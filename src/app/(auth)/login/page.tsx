'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import styles from '../auth.module.css'
import { login } from '@/actions/auth'

const initialState = {
    error: '',
}

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState)

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
