'use client'

import { useActionState } from 'react'
import { updateComplaintStatus } from '@/actions/officer'
import styles from '@/app/officer/dashboard/dashboard.module.css'

const initialState: { error?: string, success?: boolean } = {
    error: '',
    success: false
}

export default function ComplaintStatusForm({ complaintId, currentStatus }: { complaintId: string, currentStatus: string | null }) {
    const [state, formAction, isPending] = useActionState(updateComplaintStatus, initialState)

    return (
        <form action={formAction} className={styles.actionForm}>
            <input type="hidden" name="complaintId" value={complaintId} />
            <select
                name="status"
                defaultValue={currentStatus ?? 'PENDING'}
                className={styles.select}
                disabled={isPending}
            >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
            </select>
            <button type="submit" className={styles.updateBtn} disabled={isPending}>
                {isPending ? '...' : 'Update'}
            </button>
            {state?.error && <div className={styles.error} style={{ fontSize: '0.7em', color: 'red' }}>{state.error}</div>}
        </form>
    )
}
