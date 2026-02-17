'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import styles from '../auth.module.css'
import { register } from '@/actions/auth'

const initialState = {
    error: '',
}

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(register, initialState)

    return (
        <div>
            <h1 className={styles.title}>Create Account</h1>

            {state?.error && <div className={styles.error}>{state.error}</div>}

            <form action={formAction} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>Full Name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className={styles.input}
                        placeholder="John Doe"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className={styles.input}
                        placeholder="john@example.com"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="aadhaar" className={styles.label}>Aadhaar Number (Optional)</label>
                    <input
                        id="aadhaar"
                        name="aadhaar"
                        type="text"
                        className={styles.input}
                        placeholder="1234 5678 9012"
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
                    {isPending ? 'Creating Account...' : 'Register'}
                </button>
            </form>

            <div className={styles.footer}>
                Already have an account?{' '}
                <Link href="/login" className={styles.link}>
                    Sign in
                </Link>
            </div>
        </div>
    )
}
