import { getAssignedComplaints } from '@/actions/officer'
import styles from './dashboard.module.css' // We can reuse citizen styles or create new
import { format } from 'date-fns'
import ComplaintStatusForm from '@/components/officer/ComplaintStatusForm'

export default async function OfficerDashboard() {
    const complaints = await getAssignedComplaints()

    return (
        <div className={styles.container}>
            <h1>Ward Complaints</h1>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Citizen</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {complaints.map(c => (
                            <tr key={c.id}>
                                <td>{c.id.slice(0, 8)}...</td>
                                <td>{c.createdAt && format(c.createdAt, 'MMM d')}</td>
                                <td>
                                    <div className={styles.cellTitle}>{c.title}</div>
                                    <div className={styles.cellDesc}>{c.descriptionRaw.substring(0, 50)}...</div>
                                </td>
                                <td>{c.category?.name} <span className={styles.urgency}>{c.urgencyLevel}</span></td>
                                <td>{c.anonymousFlag ? 'Anonymous' : (c.citizen?.citizenProfile?.fullName || c.citizen?.email)}</td>
                                <td>
                                    {c.currentStatus && (
                                        <span className={`${styles.status} ${styles[c.currentStatus]}`}>
                                            {c.currentStatus}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <ComplaintStatusForm complaintId={c.id} currentStatus={c.currentStatus} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
