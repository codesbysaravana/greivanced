'use client'

import { useActionState } from 'react'
import { createOfficer } from '@/actions/admin'
import styles from './OfficerForm.module.css'

interface Ward {
    id: string
    name: string
}

const initialState = {
    error: '',
    success: false
} as { error?: string, success?: boolean }

export default function OfficerForm({ wards }: { wards: Ward[] }) {
    const [state, formAction, isPending] = useActionState(createOfficer, initialState)

    return (
        <form action={formAction} className={styles.form}>
            {state?.error && <div className={styles.error}>{state.error}</div>}
            {state?.success && <div className={styles.success}>Officer created successfully!</div>}

            <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Full Name</label>
                <input name="name" id="name" required className={styles.input} placeholder="Officer Name" />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
                <input name="email" id="email" type="email" required className={styles.input} placeholder="officer@ward.gov.in" />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <input name="password" id="password" type="password" required minLength={6} className={styles.input} placeholder="••••••••" />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="wardId" className={styles.label}>Assign Ward</label>
                <select name="wardId" id="wardId" required className={styles.select}>
                    <option value="">-- Select Ward --</option>
                    {wards.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Officer'}
            </button>
        </form>
    )
}
