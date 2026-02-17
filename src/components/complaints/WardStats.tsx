'use client'

import { useState } from 'react'
import styles from './WardStats.module.css'

interface WardStat {
    id: string
    name: string
    district: string
    total: number
    PENDING: number
    IN_PROGRESS: number
    RESOLVED: number
    REJECTED: number
    CLOSED: number
}

export default function WardStats({ wardStats }: { wardStats: WardStat[] }) {
    const [selectedWardId, setSelectedWardId] = useState<string>(wardStats[0]?.id || '')

    const myWard = wardStats.find(w => w.id === selectedWardId)

    if (!myWard) {
        return (
            <div className={styles.emptyWard}>
                <p>⚠️ No wards found. Please run the database seed.</p>
            </div>
        )
    }

    const resolvedPercent = myWard.total > 0 ? Math.round((myWard.RESOLVED / myWard.total) * 100) : 0

    return (
        <div className={styles.wrapper}>
            {/* My Ward Header */}
            <div className={styles.wardHeader}>
                <div className={styles.wardInfo}>
                    <span className={styles.wardLabel}>My Ward</span>
                    <select
                        className={styles.select}
                        value={selectedWardId}
                        onChange={(e) => setSelectedWardId(e.target.value)}
                    >
                        {wardStats.map(w => (
                            <option key={w.id} value={w.id}>
                                {w.name} — {w.district}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.wardBadge}>
                    <span className={styles.wardName}>{myWard.name}</span>
                    <span className={styles.wardDistrict}>{myWard.district} District</span>
                </div>
            </div>

            {/* Stats for this ward only */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statTotal}`}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{myWard.total}</span>
                        <span className={styles.statLabel}>Total Complaints</span>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statPending}`}>
                    <div className={styles.statIcon}>⏳</div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{myWard.PENDING}</span>
                        <span className={styles.statLabel}>Pending</span>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statProgress}`}>
                    <div className={styles.statIcon}>🔧</div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{myWard.IN_PROGRESS}</span>
                        <span className={styles.statLabel}>In Progress</span>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statResolved}`}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{myWard.RESOLVED}</span>
                        <span className={styles.statLabel}>Resolved</span>
                    </div>
                </div>
            </div>

            {/* Resolution Rate */}
            <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                    <span className={styles.progressTitle}>Ward Resolution Rate</span>
                    <span className={styles.progressPercent}>{resolvedPercent}%</span>
                </div>
                <div className={styles.progressTrack}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${resolvedPercent}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
