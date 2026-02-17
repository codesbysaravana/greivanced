'use client'

import { upvoteSuggestion } from '@/actions/suggestion'
import styles from './suggestions.module.css'
import { format } from 'date-fns'
import { useState } from 'react'

export default function SuggestionList({ initialSuggestions }: { initialSuggestions: any[] }) {
    const [suggestions, setSuggestions] = useState(initialSuggestions)

    const handleVote = async (id: string) => {
        // Optimistic update
        setSuggestions(prev => prev.map(s =>
            s.id === id ? { ...s, upvotes: s.upvotes + 1 } : s
        ))

        const result = await upvoteSuggestion(id)
        if (result.error) {
            // Rollback if error
            setSuggestions(prev => prev.map(s =>
                s.id === id ? { ...s, upvotes: s.upvotes - 1 } : s
            ))
        }
    }

    return (
        <div className={styles.suggestionList}>
            <div className={styles.listHeader}>
                <h2 className={styles.listTitle}>Popular Suggestions</h2>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{suggestions.length} entries</div>
            </div>

            {suggestions.length === 0 ? (
                <div className={styles.formCard} style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>No suggestions yet. Be the first to post!</p>
                </div>
            ) : (
                suggestions.map(s => (
                    <div key={s.id} className={styles.suggestionCard}>
                        <div className={styles.voteSec}>
                            <button className={styles.voteBtn} onClick={() => handleVote(s.id)}>
                                ▲
                            </button>
                            <span className={styles.voteCount}>{s.upvotes}</span>
                        </div>

                        <div className={styles.contentSec}>
                            <div className={styles.suggestionTop}>
                                <span className={`${styles.tag} ${styles['tag' + s.category] || styles.tagGeneral}`}>
                                    {s.category}
                                </span>
                                <span className={styles.suggestionMeta}>
                                    {format(new Date(s.createdAt), 'MMM d, yyyy')}
                                </span>
                            </div>

                            <h3 className={styles.suggestionTitle}>{s.title}</h3>
                            <p className={styles.suggestionDesc}>{s.description}</p>

                            <div className={styles.suggestionMeta}>
                                <span>By: {s.citizen?.citizenProfile?.fullName || 'Citizen'}</span>
                                {s.ward && <span>• Ward: {s.ward.name}</span>}
                            </div>

                            {s.adminResponse && (
                                <div className={styles.adminResponse}>
                                    <span className={styles.adminLabel}>Official Response</span>
                                    <p className={styles.adminText}>{s.adminResponse}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
