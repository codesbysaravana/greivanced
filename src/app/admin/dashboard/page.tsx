import { getDashboardStats, getAllComplaints, getWardMetrics } from '@/actions/admin'
import styles from './dashboard.module.css'
import { format } from 'date-fns'

export default async function AdminDashboard() {
    const stats = await getDashboardStats()
    const complaints = await getAllComplaints()
    const wardMetrics = await getWardMetrics()

    if (!stats) return <div>Unauthorized</div>

    return (
        <div className={styles.container}>
            <h1>Admin Dashboard</h1>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Total Complaints</h3>
                    <p className={styles.statValue}>{stats.totalComplaints}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Pending</h3>
                    <p className={`${styles.statValue} ${styles.pending}`}>{stats.pending}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>In Progress</h3>
                    <p className={`${styles.statValue} ${styles.progress}`}>{stats.inProgress}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Resolved</h3>
                    <p className={`${styles.statValue} ${styles.resolved}`}>{stats.resolved}</p>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Ward Performance</h2>
                <div className={styles.barChart}>
                    {wardMetrics.slice(0, 5).map(m => (
                        <div key={m.wardId || 'orphan'} className={styles.barItem}>
                            <span className={styles.barLabel}>{m.wardName}</span>
                            <div className={styles.barTrack}>
                                <div
                                    className={styles.barFill}
                                    style={{ width: `${Math.min((m.count / (wardMetrics[0].count || 1)) * 100, 100)}%` }}
                                >
                                    {m.count}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <h2>Recent Activity</h2>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Title</th>
                                <th>Ward</th>
                                <th>Assigned To</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        {c.createdAt && format(c.createdAt, 'MMM d, HH:mm')}
                                    </td>
                                    <td>{c.title}</td>
                                    <td>{c.ward?.name || '-'}</td>
                                    <td>{c.assignments && c.assignments.length > 0
                                        ? c.assignments.map(a => a.officer.citizenProfile?.fullName || a.officer.email).join(', ')
                                        : 'Unassigned'}</td>
                                    <td>
                                        {c.currentStatus && (
                                            <span className={`${styles.status} ${styles[c.currentStatus]}`}>
                                                {c.currentStatus}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
