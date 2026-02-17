'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import ComplaintStatusForm from './ComplaintStatusForm'
import ComplaintEditForm from './ComplaintEditForm'
import ComplaintDeleteBtn from './ComplaintDeleteBtn'
import styles from '@/app/officer/dashboard/dashboard.module.css'
import {
    MapPin,
    User,
    ClipboardList,
    AlertCircle,
    Clock,
    CheckCircle2,
    Calendar,
    LayoutList,
    Pencil
} from 'lucide-react'

interface Ward {
    id: string
    name: string
    district: string
    officerName: string
    complaintCount: number
}

interface Complaint {
    id: string
    title: string
    descriptionRaw: string
    currentStatus: string | null
    urgencyLevel: string | null
    createdAt: Date | null
    anonymousFlag: boolean | null
    citizen: {
        email: string
        citizenProfile: { fullName: string } | null
    }
    category: { name: string } | null
    ward: { name: string } | null
}

export default function OfficerDashboardClient({
    wards,
    complaints,
    selectedWardId,
}: {
    wards: Ward[]
    complaints: Complaint[]
    selectedWardId: string
}) {
    const router = useRouter()
    const [editingId, setEditingId] = useState<string | null>(null)
    const selectedWard = wards.find((w) => w.id === selectedWardId)

    const stats = {
        total: complaints.length,
        pending: complaints.filter((c) => c.currentStatus === 'PENDING').length,
        inProgress: complaints.filter((c) => c.currentStatus === 'IN_PROGRESS').length,
        resolved: complaints.filter((c) => c.currentStatus === 'RESOLVED').length,
    }

    return (
        <div className={styles.container}>
            {/* Elegant Ward Header */}
            <div className={styles.wardHeader}>
                <div className={styles.wardInfo}>
                    <h1>{selectedWard?.name || 'My Ward'}</h1>
                    <div className={styles.wardMeta}>
                        <div className={styles.metaItem}>
                            <MapPin size={16} />
                            <span>{selectedWard?.district} District</span>
                        </div>
                        <div className={styles.metaItem}>
                            <User size={16} />
                            <span>Officer: {selectedWard?.officerName}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.wardBadge}>
                    <span className={styles.label}>Switch Ward</span>
                    <select
                        className={styles.statusSelect}
                        style={{ minWidth: '200px', background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                        value={selectedWardId}
                        onChange={(e) => router.push(`/officer/dashboard?ward=${e.target.value}`)}
                    >
                        {wards.map((w) => (
                            <option key={w.id} value={w.id} style={{ color: 'black' }}>
                                {w.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Overview */}
            <div className={styles.statsRow}>
                <div className={`${styles.statItem} ${styles.statTotal}`}>
                    <div className={styles.statIcon}><ClipboardList size={22} /></div>
                    <div className={styles.statDetails}>
                        <span className={styles.statNum}>{stats.total}</span>
                        <span className={styles.statLbl}>Total</span>
                    </div>
                </div>
                <div className={`${styles.statItem} ${styles.statPending}`}>
                    <div className={styles.statIcon}><AlertCircle size={22} /></div>
                    <div className={styles.statDetails}>
                        <span className={styles.statNum}>{stats.pending}</span>
                        <span className={styles.statLbl}>Pending</span>
                    </div>
                </div>
                <div className={`${styles.statItem} ${styles.statProgress}`}>
                    <div className={styles.statIcon}><Clock size={22} /></div>
                    <div className={styles.statDetails}>
                        <span className={styles.statNum}>{stats.inProgress}</span>
                        <span className={styles.statLbl}>In Progress</span>
                    </div>
                </div>
                <div className={`${styles.statItem} ${styles.statResolved}`}>
                    <div className={styles.statIcon}><CheckCircle2 size={22} /></div>
                    <div className={styles.statDetails}>
                        <span className={styles.statNum}>{stats.resolved}</span>
                        <span className={styles.statLbl}>Resolved</span>
                    </div>
                </div>
            </div>

            <h2 className={styles.sectionTitle}><LayoutList size={22} /> Ward Grievances</h2>

            {/* Complaints Data Grid */}
            <div className={styles.tableContainer}>
                {complaints.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                        <ClipboardList size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No complaints filed in this ward yet.</p>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Title & Info</th>
                                    <th>Category & Priority</th>
                                    <th>Submission</th>
                                    <th>Current Status</th>
                                    <th>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map((c) => (
                                    <tr key={c.id}>
                                        <td className={styles.titleCell}>
                                            {editingId === c.id ? (
                                                <ComplaintEditForm
                                                    complaint={c}
                                                    wardId={selectedWardId}
                                                    onCancel={() => setEditingId(null)}
                                                    onSuccess={() => setEditingId(null)}
                                                />
                                            ) : (
                                                <>
                                                    <span className={styles.complaintTitle}>{c.title}</span>
                                                    <span className={styles.complaintDesc}>{c.descriptionRaw}</span>
                                                    <div style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: '#94a3b8' }}>ID: {c.id.slice(0, 8).toUpperCase()}</div>
                                                </>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>{c.category?.name}</div>
                                            {c.urgencyLevel && (
                                                <span className={`${styles.urgencyBadge} ${styles[`urgency_${c.urgencyLevel}`]}`}>
                                                    {c.urgencyLevel}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
                                                    <Calendar size={14} />
                                                    {c.createdAt && format(c.createdAt, 'MMM d, yyyy')}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
                                                    <User size={14} />
                                                    {c.anonymousFlag ? 'Incognito' : c.citizen?.citizenProfile?.fullName || c.citizen?.email.split('@')[0]}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {c.currentStatus && (
                                                <span className={`${styles.status} ${styles[c.currentStatus]}`}>
                                                    {c.currentStatus.replace('_', ' ')}
                                                </span>
                                            )}
                                        </td>
                                        <td className={styles.actionsCell}>
                                            {editingId !== c.id && (
                                                <>
                                                    <ComplaintStatusForm
                                                        complaintId={c.id}
                                                        currentStatus={c.currentStatus}
                                                        wardId={selectedWardId}
                                                    />
                                                    <div className={styles.actionRow}>
                                                        <button
                                                            className={styles.btnIcon}
                                                            onClick={() => setEditingId(c.id)}
                                                            title="Edit Detail"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <ComplaintDeleteBtn
                                                            complaintId={c.id}
                                                            wardId={selectedWardId}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
