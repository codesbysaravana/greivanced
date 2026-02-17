'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import styles from '../auth.module.css'
import { login } from '@/actions/auth'

const initialState = { error: '' }

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState)

    return (
        <div>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Sign in to your account to continue</p>

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
                        placeholder="you@example.com"
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
                        minLength={6}
                    />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isPending}>
                    {isPending ? 'Signing in...' : 'Sign In →'}
                </button>
            </form>

            <div className={styles.footer}>
                Don&apos;t have an account?{' '}
                <Link href="/register" className={styles.link}>
                    Create one
                </Link>
            </div>

            {/* Demo credentials for easy testing */}
            <div className={styles.credentialsHint}>
                <div className={styles.credentialsTitle}>Demo Credentials (password: SuperPassword2026)</div>
                <div className={styles.credentialRow}>
                    <span className={styles.credentialRole}>👤 Citizen</span>
                    <span className={styles.credentialEmail}>citizen@gov.in</span>
                </div>
                <div className={styles.credentialRow}>
                    <span className={styles.credentialRole}>🛡️ Officer</span>
                    <span className={styles.credentialEmail}>officer.chennai@gov.in</span>
                </div>
                <div className={styles.credentialRow}>
                    <span className={styles.credentialRole}>⚙️ Admin</span>
                    <span className={styles.credentialEmail}>superadmin@gov.in</span>
                </div>
            </div>
        </div>
    )
}
