import { getAllComplaints } from '@/actions/admin'
import EscalationControls from '@/components/admin/EscalationControls'
import { format } from 'date-fns'
import styles from './complaints.module.css'

export default async function ComplaintsPage() {
    const complaints = await getAllComplaints()

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>All Complaints</h1>
                <EscalationControls />
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Details</th>
                            <th>Category</th>
                            <th>Ward / Assigned</th>
                            <th>Creator</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {complaints.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No complaints found</td></tr>
                        ) : (
                            complaints.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        {c.createdAt && (
                                            <>
                                                {format(c.createdAt, 'MMM d, yyyy')}<br />
                                                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                                                    {format(c.createdAt, 'HH:mm')}
                                                </span>
                                            </>
                                        )}
                                    </td>
                                    <td>
                                        <div className={styles.cellTitle}>{c.title}</div>
                                        <div className={styles.cellDesc}>{c.descriptionRaw.substring(0, 100)}...</div>
                                    </td>
                                    <td>
                                        {c.category?.name}
                                        <br />
                                        <span className={styles.urgency}>{c.urgencyLevel}</span>
                                    </td>
                                    <td>
                                        <div>Ward: {c.ward?.name || 'Unassigned'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                            Assigned: {c.assignments && c.assignments.length > 0
                                                ? c.assignments.map(a => a.officer.citizenProfile?.fullName || a.officer.email).join(', ')
                                                : 'Unassigned'}
                                        </div>
                                    </td>
                                    <td>
                                        {c.anonymousFlag ? 'Anonymous' : (
                                            <>
                                                <div>{c.citizen?.citizenProfile?.fullName || 'N/A'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{c.citizen?.email}</div>
                                            </>
                                        )}
                                    </td>
                                    <td>
                                        {c.currentStatus && (
                                            <span className={`${styles.status} ${styles[c.currentStatus]}`}>
                                                {c.currentStatus}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    )
}
