import Link from 'next/link'
import { getCitizenComplaints, getWardComplaintStats } from '@/actions/complaint'
import WardStats from '@/components/complaints/WardStats'
import styles from './dashboard.module.css'
import { format } from 'date-fns'
import {
    Plus,
    Clock,
    Calendar,
    MapPin,
    Tag,
    ChevronRight,
    ClipboardList
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CitizenDashboard() {
    const [complaints, wardStats] = await Promise.all([
        getCitizenComplaints(),
        getWardComplaintStats()
    ])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>My Complaints</h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Track and manage your submitted grievances
                    </p>
                </div>
                <Link href="/citizen/new-complaint" className={styles.newBtn}>
                    <Plus size={20} />
                    <span>New Complaint</span>
                </Link>
            </div>

            {/* Ward-wise Complaint Stats */}
            <WardStats wardStats={wardStats} />

            {/* Complaints List */}
            <div className={styles.sectionTitle}>
                <ClipboardList size={20} />
                <h2>Recent Submissions</h2>
            </div>

            <div className={styles.grid}>
                {complaints.length === 0 ? (
                    <div className={styles.empty}>
                        <ClipboardList size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p>No complaints filed yet. Your active reports will appear here.</p>
                    </div>
                ) : (
                    complaints.map((c) => (
                        <div key={c.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                {c.currentStatus && (
                                    <span className={`${styles.status} ${styles[c.currentStatus]}`}>
                                        {c.currentStatus.replace('_', ' ')}
                                    </span>
                                )}
                                <div className={styles.date}>
                                    <Calendar size={14} />
                                    {c.createdAt && format(c.createdAt, 'MMM d, yyyy')}
                                </div>
                            </div>

                            <h3 className={styles.cardTitle}>{c.title}</h3>
                            <p className={styles.description}>{c.descriptionRaw}</p>

                            <div className={styles.meta}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div className={styles.metaItem}>
                                        <Tag size={14} />
                                        <span className={styles.tag}>{c.category?.name}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <MapPin size={14} />
                                        <span>{c.ward?.name || 'Unassigned'}</span>
                                    </div>
                                </div>

                                <Link href={`/citizen/track`} className={styles.viewLink} style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                    Details <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
