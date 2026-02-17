'use client'

import { useActionState } from 'react'
import { editComplaint } from '@/actions/officer'
import styles from '@/app/officer/dashboard/dashboard.module.css'

interface Complaint {
    id: string
    title: string
    descriptionRaw: string
    urgencyLevel: string | null
}

const initialState: { error?: string; success?: boolean } = { error: '', success: false }

export default function ComplaintEditForm({
    complaint,
    wardId,
    onCancel,
    onSuccess,
}: {
    complaint: Complaint
    wardId: string
    onCancel: () => void
    onSuccess: () => void
}) {
    const [state, formAction, isPending] = useActionState(
        async (prev: typeof initialState, formData: FormData) => {
            const result = await editComplaint(prev, formData)
            if (result.success) onSuccess()
            return result
        },
        initialState
    )

    return (
        <form action={formAction} className={styles.editForm}>
            <input type="hidden" name="complaintId" value={complaint.id} />
            <input type="hidden" name="wardId" value={wardId} />
            <input
                name="title"
                defaultValue={complaint.title}
                className={styles.editInput}
                placeholder="Title"
                required
            />
            <textarea
                name="description"
                defaultValue={complaint.descriptionRaw}
                className={styles.editTextarea}
                rows={3}
                placeholder="Description"
                required
            />
            <select name="urgency" defaultValue={complaint.urgencyLevel ?? 'MEDIUM'} className={styles.editSelect}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
            </select>
            <div className={styles.editActions}>
                <button type="submit" className={styles.saveBtn} disabled={isPending}>
                    {isPending ? 'Saving...' : '💾 Save'}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={onCancel}>
                    Cancel
                </button>
            </div>
            {state?.error && <span className={styles.formError}>{state.error}</span>}
        </form>
    )
}
