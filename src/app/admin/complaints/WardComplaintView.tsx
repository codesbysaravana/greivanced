'use client'

import React, { useState, useActionState } from 'react'
import { format } from 'date-fns'
import styles from './complaints.module.css'
import { ChevronDown, ChevronRight, User, MapPin, Tag, Clock, CheckCircle2, XCircle, MoreVertical } from 'lucide-react'
import { adminUpdateComplaintStatus } from '@/actions/admin'

export default function WardComplaintView({ wardData }: { wardData: any[] }) {
    const [expandedWards, setExpandedWards] = useState<Record<string, boolean>>({})
    const [showManageId, setShowManageId] = useState<string | null>(null)

    const toggleWard = (wardId: string) => {
        setExpandedWards(prev => ({
            ...prev,
            [wardId]: !prev[wardId]
        }))
    }

    return (
        <div className={styles.wardView}>
            {wardData.map(ward => (
                <div key={ward.id} className={styles.wardSection}>
                    <div
                        className={styles.wardHeader}
                        onClick={() => toggleWard(ward.id)}
                    >
                        <div className={styles.wardHeaderMain}>
                            {expandedWards[ward.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            <MapPin size={18} className={styles.headerIcon} />
                            <h3>{ward.name} Ward</h3>
                        </div>
                        <div className={styles.wardBadge}>
                            {ward.complaints.length} Complaints
                        </div>
                    </div>

                    {expandedWards[ward.id] && (
                        <div className={styles.complaintList}>
                            {ward.complaints.length === 0 ? (
                                <div className={styles.noComplaints}>No complaints for this ward.</div>
                            ) : (
                                ward.complaints.map((c: any) => (
                                    <div key={c.id} className={styles.complaintCard}>
                                        <div className={styles.cardMain}>
                                            <div className={styles.cardHeader}>
                                                <span className={`${styles.status} ${styles[c.currentStatus]}`}>
                                                    {c.currentStatus}
                                                </span>
                                                <span className={styles.date}>
                                                    <Clock size={14} />
                                                    {format(new Date(c.createdAt), 'MMM d, yyyy HH:mm')}
                                                </span>
                                            </div>
                                            <h4>{c.title}</h4>
                                            <p>{c.descriptionRaw}</p>

                                            <div className={styles.adminActions}>
                                                <button
                                                    className={styles.manageBtn}
                                                    onClick={() => setShowManageId(showManageId === c.id ? null : c.id)}
                                                >
                                                    <MoreVertical size={16} /> Manage Status
                                                </button>

                                                {showManageId === c.id && (
                                                    <div className={styles.statusFormWrapper}>
                                                        <form action={async (formData) => {
                                                            await adminUpdateComplaintStatus({}, formData)
                                                            setShowManageId(null)
                                                        }} className={styles.inlineForm}>
                                                            <input type="hidden" name="complaintId" value={c.id} />
                                                            <select name="status" defaultValue={c.currentStatus} className={styles.select}>
                                                                <option value="PENDING">Pending</option>
                                                                <option value="IN_PROGRESS">In Progress</option>
                                                                <option value="RESOLVED">Resolved</option>
                                                                <option value="REJECTED">Rejected</option>
                                                            </select>
                                                            <input
                                                                name="remarks"
                                                                placeholder="Admin remarks (sent to citizen)..."
                                                                className={styles.remarksInput}
                                                            />
                                                            <button type="submit" className={styles.confirmBtn}>Update & Notify Citizen</button>
                                                        </form>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.cardSide}>
                                            <div className={styles.sideItem}>
                                                <Tag size={14} />
                                                <span>{c.category?.name}</span>
                                            </div>
                                            <div className={styles.sideItem}>
                                                <User size={14} />
                                                <span>{c.anonymousFlag ? 'Anonymous' : (c.citizen?.citizenProfile?.fullName || 'N/A')}</span>
                                            </div>
                                            <div className={styles.officerBox}>
                                                <strong>Assigned Officers:</strong>
                                                <p>
                                                    {c.assignments && c.assignments.length > 0
                                                        ? c.assignments.map((a: any) => a.officer.citizenProfile?.fullName || a.officer.email).join(', ')
                                                        : 'Unassigned'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
