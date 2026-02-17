import { getDashboardStats, getAllComplaints, getWardMetrics } from '@/actions/admin'
import styles from './dashboard.module.css'
import { format } from 'date-fns'
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Activity,
    ArrowUpRight,
    Zap
} from 'lucide-react'
import CleanChecks from '@/components/admin/CleanChecks'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    const stats = await getDashboardStats()
    const complaints = await getAllComplaints()
    const wardMetrics = await getWardMetrics()

    if (!stats) return <div className={styles.container}>Loading dashboard data...</div>

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Dashboard Overview</h1>
                    <div className={styles.dateDisplay}>
                        {format(new Date(), 'EEEE, MMMM do')}
                    </div>
                </div>
            </header>

            <CleanChecks />

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <h3>Total Complaints</h3>
                        <div className={`${styles.statIcon} ${styles.totalIcon}`}>
                            <ClipboardList size={20} />
                        </div>
                    </div>
                    <p className={styles.statValue}>{stats.totalComplaints}</p>
                    <div className={styles.statTrend}>
                        <ArrowUpRight size={14} />
                        <span>All time reports</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <h3>Pending Approval</h3>
                        <div className={`${styles.statIcon} ${styles.pendingIcon}`}>
                            <AlertCircle size={20} />
                        </div>
                    </div>
                    <p className={styles.statValue}>{stats.pending}</p>
                    <div className={styles.statTrend} style={{ color: '#d97706' }}>
                        <span>Awaiting review</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <h3>In Progress</h3>
                        <div className={`${styles.statIcon} ${styles.progressIcon}`}>
                            <Clock size={20} />
                        </div>
                    </div>
                    <p className={styles.statValue}>{stats.inProgress}</p>
                    <div className={styles.statTrend} style={{ color: '#16a34a' }}>
                        <span>Active resolutions</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <h3>Resolved</h3>
                        <div className={`${styles.statIcon} ${styles.resolvedIcon}`}>
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <p className={styles.statValue}>{stats.resolved}</p>
                    <div className={styles.statTrend} style={{ color: '#db2777' }}>
                        <span>Closed successfully</span>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.card}>
                    <h2><Activity size={20} /> Recent Activity</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Ward</th>
                                    <th>Assigned To</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.slice(0, 8).map(c => (
                                    <tr key={c.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{c.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {c.createdAt && format(c.createdAt, 'MMM d, h:mm a')}
                                            </div>
                                        </td>
                                        <td>{c.ward?.name || '-'}</td>
                                        <td>
                                            {c.assignments && c.assignments.length > 0
                                                ? c.assignments[0].officer.citizenProfile?.fullName || c.assignments[0].officer.email
                                                : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}
                                        </td>
                                        <td>
                                            {c.currentStatus && (
                                                <span className={`${styles.status} ${styles[c.currentStatus]}`}>
                                                    {c.currentStatus.replace('_', ' ')}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.card}>
                    <h2><BarChart3 size={20} /> Ward Distribution</h2>
                    <div className={styles.barChart}>
                        {wardMetrics.slice(0, 6).map(m => {
                            const maxCount = wardMetrics[0]?.count || 1
                            const percentage = (m.count / maxCount) * 100
                            return (
                                <div key={m.wardId || 'other'} className={styles.barItem} title={`${m.count} complaints`}>
                                    <div className={styles.barMeta}>
                                        <span className={styles.barLabel}>{m.wardName}</span>
                                        <span className={styles.barCount}>{m.count}</span>
                                    </div>
                                    <div className={styles.barTrack}>
                                        <div
                                            className={styles.barFill}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
