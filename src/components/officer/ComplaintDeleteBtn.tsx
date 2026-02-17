'use client'

import { useState, useTransition } from 'react'
import { deleteComplaint } from '@/actions/officer'
import { useRouter } from 'next/navigation'
import styles from '@/app/officer/dashboard/dashboard.module.css'

export default function ComplaintDeleteBtn({
    complaintId,
    wardId,
}: {
    complaintId: string
    wardId: string
}) {
    const [confirming, setConfirming] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const router = useRouter()

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteComplaint(complaintId, wardId)
            if (result.error) {
                setError(result.error)
                setConfirming(false)
            } else {
                router.refresh()
            }
        })
    }

    if (confirming) {
        return (
            <div className={styles.confirmDelete}>
                <span className={styles.confirmText}>Delete?</span>
                <button className={styles.confirmYes} onClick={handleDelete} disabled={isPending}>
                    {isPending ? '...' : 'Yes'}
                </button>
                <button className={styles.confirmNo} onClick={() => setConfirming(false)}>
                    No
                </button>
                {error && <span className={styles.formError}>{error}</span>}
            </div>
        )
    }

    return (
        <button
            className={styles.deleteBtn}
            onClick={() => setConfirming(true)}
            title="Delete"
        >
            🗑️
        </button>
    )
}
