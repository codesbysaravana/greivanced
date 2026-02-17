'use client'

import { useState, useEffect } from 'react'
import { getUrgentComplaints } from '@/actions/admin'
import styles from './CleanChecks.module.css'
import { AlertTriangle, Clock, ChevronRight, X, ShieldAlert, Zap, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function CleanChecks() {
    const [urgentData, setUrgentData] = useState<{
        critical: any[],
        stalled: any[]
    } | null>(null)
    const [loading, setLoading] = useState(false)
    const [showOverlay, setShowOverlay] = useState(false)
    const [hasRun, setHasRun] = useState(false)

    // Optional: Auto-run on mount or use a long-lived interval
    // For now, only manual trigger as requested ("a button at admin to RUN")

    const handleRunChecks = async () => {
        setLoading(true)
        try {
            const data = await getUrgentComplaints()
            if (data) {
                setUrgentData(data)
                setHasRun(true)
            }
        } catch (error) {
            console.error('Clean checks failed:', error)
        } finally {
            setLoading(false)
        }
    }

    const totalUrgent = (urgentData?.critical.length || 0) + (urgentData?.stalled.length || 0)

    return (
        <div className={styles.cleanChecksWrapper}>
            {/* The Control Button - usually in the header */}
            <div className={styles.controls}>
                <button
                    className={loading ? `${styles.runBtn} ${styles.loading}` : styles.runBtn}
                    onClick={handleRunChecks}
                    disabled={loading}
                    title="Scan for critical and overdue issues"
                >
                    {loading ? <RefreshCw size={18} className={styles.spin} /> : <Zap size={18} />}
                    <span>{loading ? 'Scanning...' : (hasRun ? 'Re-run Checks' : 'Run Clean Checks')}</span>
                </button>
            </div>

            {/* The Big Alert Notification - only shows if issues found */}
            {hasRun && totalUrgent > 0 && (
                <div className={styles.globalAlert} onClick={() => setShowOverlay(true)}>
                    <div className={styles.alertPulse}></div>
                    <div className={styles.alertContent}>
                        <div className={styles.alertIcon}>
                            <ShieldAlert size={32} />
                        </div>
                        <div className={styles.alertMessage}>
                            <h2>ACT IMMEDIATELY</h2>
                            <p>
                                <strong>{totalUrgent}</strong> critical issues detected.
                                {urgentData?.critical.length} high-severity and {urgentData?.stalled.length} overdue reports.
                            </p>
                        </div>
                    </div>
                    <button className={styles.detailsBtn}>
                        <span>Intervention Portal</span>
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* The "All Clear" Feedback */}
            {hasRun && totalUrgent === 0 && !loading && (
                <div className={styles.allClearFeedback}>
                    <div className={styles.checkMark}>✓</div>
                    <span>Infrastructure Integrity Confirmed. No Urgent Complaints.</span>
                </div>
            )}

            {/* The Detailed Intervention Overlay */}
            {showOverlay && (
                <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowOverlay(false)}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>
                                <AlertTriangle size={28} color="#ef4444" />
                                <div>
                                    <h2>Crisis Management Protocol</h2>
                                    <p>High-priority grievances requiring immediate administrative override</p>
                                </div>
                            </div>
                            <button className={styles.closeModal} onClick={() => setShowOverlay(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className={styles.modalScroll}>
                            {urgentData && urgentData.critical.length > 0 && (
                                <section className={styles.issueGroup}>
                                    <div className={styles.groupHeader}>
                                        <div className={styles.groupIcon}><ShieldAlert size={20} /></div>
                                        <h3>Critical Severity Reports ({urgentData.critical.length})</h3>
                                    </div>
                                    <div className={styles.issueGrid}>
                                        {urgentData.critical.map((issue: any) => (
                                            <div key={issue.id} className={styles.issueCard}>
                                                <div className={styles.issueTag}>CRITICAL</div>
                                                <h4>{issue.title}</h4>
                                                <div className={styles.issueLocation}>{issue.ward?.name} Ward • {issue.category?.name}</div>
                                                <div className={styles.issueFooter}>
                                                    <span className={styles.timestamp}>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                                                    <div className={styles.assignedOfficer}>
                                                        {issue.assignments[0]?.officer.citizenProfile?.fullName || 'Awaiting Resource'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {urgentData && urgentData.stalled.length > 0 && (
                                <section className={styles.issueGroup}>
                                    <div className={styles.groupHeader}>
                                        <div className={styles.groupIcon}><Clock size={20} /></div>
                                        <h3>Overdue Compliance ({'>'} 30 Hours) ({urgentData.stalled.length})</h3>
                                    </div>
                                    <div className={styles.issueGrid}>
                                        {urgentData.stalled.map((issue: any) => (
                                            <div key={issue.id} className={`${styles.issueCard} ${styles.stalled}`}>
                                                <div className={styles.issueTag}>STALLED</div>
                                                <h4>{issue.title}</h4>
                                                <div className={styles.issueLocation}>{issue.ward?.name} Ward • {issue.category?.name}</div>
                                                <div className={styles.issueFooter}>
                                                    <span className={styles.timeDelay}>
                                                        Overdue by {formatDistanceToNow(new Date(new Date(issue.createdAt).getTime() + 30 * 60 * 60 * 1000))}
                                                    </span>
                                                    <div className={styles.assignedOfficer}>
                                                        {issue.assignments[0]?.officer.citizenProfile?.fullName || 'Awaiting Resource'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <p>Resolution tracking of these issues is now being prioritized in your dashboard logs.</p>
                            <button className={styles.dismissBtn} onClick={() => setShowOverlay(false)}>
                                Close Portal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
