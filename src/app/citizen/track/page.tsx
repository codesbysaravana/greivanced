import { getComplaintsWithTracking } from '@/actions/complaint'
import styles from './track.module.css'
import { format, formatDistanceToNow } from 'date-fns'
import {
    Search,
    Tag,
    MapPin,
    Calendar,
    XCircle,
    CheckCircle,
    User,
    Hash,
    ClipboardX,
    Clock
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_STEPS = ['PENDING', 'IN_PROGRESS', 'RESOLVED'] as const

function getStatusIndex(status: string | null): number {
    if (!status) return 0
    if (status === 'REJECTED') return -1
    return STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number])
}

function getUrgencyClass(urgency: string | null | undefined): string {
    switch (urgency) {
        case 'LOW': return styles.urgencyLow
        case 'MEDIUM': return styles.urgencyMedium
        case 'HIGH': return styles.urgencyHigh
        case 'CRITICAL': return styles.urgencyCritical
        default: return ''
    }
}

export default async function TrackStatusPage() {
    const complaints = await getComplaintsWithTracking()

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <Search size={32} className={styles.headerIcon} style={{ color: 'var(--accent-color)' }} />
                    <h1>Track Complaint Status</h1>
                </div>
                <p className={styles.subtitle}>Monitor the progress of your submitted complaints in real-time</p>
            </div>

            {complaints.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <ClipboardX size={64} style={{ opacity: 0.1 }} />
                    </div>
                    <h3>No complaints under track</h3>
                    <p>You haven&apos;t submitted any complaints. File one to start tracking your resolution status.</p>
                </div>
            ) : (
                <div className={styles.trackList}>
                    {complaints.map((complaint) => {
                        const currentIdx = getStatusIndex(complaint.currentStatus)
                        const isRejected = complaint.currentStatus === 'REJECTED'
                        const isResolved = complaint.currentStatus === 'RESOLVED'
                        const isClosed = complaint.currentStatus === 'CLOSED'

                        return (
                            <div
                                key={complaint.id}
                                className={`${styles.trackCard} ${isResolved ? styles.trackCardResolved : ''} ${isRejected ? styles.trackCardRejected : ''}`}
                            >
                                {/* Card Header */}
                                <div className={styles.cardTop}>
                                    <div className={styles.cardInfo}>
                                        <h3 className={styles.cardTitle}>{complaint.title}</h3>
                                        <div className={styles.cardMeta}>
                                            <span className={styles.metaItem}>
                                                <Tag size={14} />
                                                {complaint.category?.name || 'Uncategorized'}
                                            </span>
                                            <span className={styles.metaItem}>
                                                <MapPin size={14} />
                                                {complaint.ward?.name || 'Unknown Ward'}
                                            </span>
                                            {complaint.urgencyLevel && (
                                                <span className={`${styles.urgencyBadge} ${getUrgencyClass(complaint.urgencyLevel)}`}>
                                                    {complaint.urgencyLevel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.cardTimestamp}>
                                        <span className={styles.dateLabel}><Calendar size={12} /> Filed On</span>
                                        <span className={styles.dateValue}>
                                            {complaint.createdAt ? format(complaint.createdAt, 'MMM d, yyyy') : '—'}
                                        </span>
                                        <span className={styles.dateAgo}>
                                            {complaint.createdAt ? formatDistanceToNow(complaint.createdAt, { addSuffix: true }) : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Status Timeline */}
                                {isRejected ? (
                                    <div className={styles.rejectedBanner}>
                                        <XCircle size={24} className={styles.rejectedIcon} />
                                        <div>
                                            <strong>Complaint Rejected</strong>
                                            <p>
                                                This issue was reviewed and could not be entertained at this time.
                                                {complaint.lastStatusChangedAt
                                                    ? ` (Closed on ${format(complaint.lastStatusChangedAt, 'MMM d, yyyy')})`
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.timeline}>
                                        {STATUS_STEPS.map((step, idx) => {
                                            const isCompleted = idx <= currentIdx
                                            const isCurrent = idx === currentIdx
                                            const isLast = idx === STATUS_STEPS.length - 1

                                            return (
                                                <div key={step} className={styles.timelineStep}>
                                                    <div className={`${styles.stepDot} ${isCompleted ? styles.stepCompleted : ''} ${isCurrent ? styles.stepCurrent : ''}`}>
                                                        {isCompleted && !isCurrent ? (
                                                            <CheckCircle size={16} color="white" />
                                                        ) : isCurrent ? (
                                                            <div className={styles.stepPulse} />
                                                        ) : (
                                                            <Clock size={16} opacity={0.3} />
                                                        )}
                                                    </div>
                                                    {!isLast && (
                                                        <div className={`${styles.stepLine} ${idx < currentIdx ? styles.stepLineCompleted : ''}`} />
                                                    )}
                                                    <div className={styles.stepLabel}>
                                                        <span className={`${styles.stepName} ${isCurrent ? styles.stepNameActive : ''}`}>
                                                            {step.replace('_', ' ')}
                                                        </span>
                                                        {isCurrent && complaint.lastStatusChangedAt && (
                                                            <span className={styles.stepDate}>
                                                                {format(complaint.lastStatusChangedAt, 'MMM d, h:mm a')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Resolution info */}
                                {(isResolved || isClosed) && complaint.createdAt && complaint.lastStatusChangedAt && (
                                    <div className={styles.resolvedBanner}>
                                        <CheckCircle size={24} className={styles.resolvedIcon} />
                                        <div>
                                            <strong>Grievance Resolved</strong>
                                            <p>
                                                Successful completion within{' '}
                                                {formatDistanceToNow(complaint.createdAt, { addSuffix: false }).replace('about ', '')}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Assigned officer */}
                                {complaint.assignments && complaint.assignments.length > 0 && (
                                    <div className={styles.assignedInfo}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div className={styles.officerAvatar}><User size={14} /></div>
                                            <span className={styles.assignedLabel}>Handling Officer:</span>
                                            <span className={styles.assignedName}>
                                                {complaint.assignments.map(a =>
                                                    a.officer?.citizenProfile?.fullName || a.officer?.email.split('@')[0]
                                                ).join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Complaint ID */}
                                <div className={styles.cardFooter}>
                                    <span className={styles.complaintId}><Hash size={12} /> {complaint.id.toUpperCase()}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
