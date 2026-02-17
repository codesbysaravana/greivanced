import Link from 'next/link'
import { getCitizenComplaints } from '@/actions/complaint'
import styles from './dashboard.module.css'
import { format } from 'date-fns'

export default async function CitizenDashboard() {
    const complaints = await getCitizenComplaints()

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>My Complaints</h1>
                <Link href="/citizen/new-complaint" className={styles.newBtn}>
                    + New Complaint
                </Link>
            </div>

            <div className={styles.grid}>
                {complaints.length === 0 ? (
                    <p className={styles.empty}>No complaints filed yet.</p>
                ) : (
                    complaints.map((c) => (
                        <div key={c.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                {c.currentStatus && (
                                    <span className={`${styles.status} ${styles[c.currentStatus]}`}>
                                        {c.currentStatus.replace('_', ' ')}
                                    </span>
                                )}
                                {c.createdAt && (
                                    <span className={styles.date}>{format(c.createdAt, 'MMM d, yyyy')}</span>
                                )}
                            </div>
                            <h3 className={styles.cardTitle}>{c.title}</h3>
                            <p className={styles.description}>{c.descriptionRaw.substring(0, 100)}...</p>
                            <div className={styles.meta}>
                                <span>Category: {c.category?.name}</span>
                                <span>Ward: {c.ward?.name || 'Unassigned'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
