'use client'

import { useActionState } from 'react'
import { updateComplaintStatus } from '@/actions/officer'
import styles from '@/app/officer/dashboard/dashboard.module.css'

const initialState: { error?: string; success?: boolean } = { error: '', success: false }

export default function ComplaintStatusForm({
    complaintId,
    currentStatus,
    wardId,
}: {
    complaintId: string
    currentStatus: string | null
    wardId: string
}) {
    const [state, formAction, isPending] = useActionState(updateComplaintStatus, initialState)

    return (
        <form action={formAction} className={styles.actionForm}>
            <input type="hidden" name="complaintId" value={complaintId} />
            <input type="hidden" name="wardId" value={wardId} />
            <select
                name="status"
                defaultValue={currentStatus ?? 'PENDING'}
                className={styles.select}
                disabled={isPending}
            >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
            </select>
            <button type="submit" className={styles.updateBtn} disabled={isPending}>
                {isPending ? '...' : 'Update'}
            </button>
            {state?.error && (
                <span className={styles.formError}>{state.error}</span>
            )}
        </form>
    )
}
