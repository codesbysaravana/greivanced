'use client'

import { respondToSuggestion } from '@/actions/suggestion'
import { useState } from 'react'
import { format } from 'date-fns'
import styles from './admin-suggestions.module.css'

export default function AdminSuggestionList({ initialSuggestions }: { initialSuggestions: any[] }) {
    const [suggestions, setSuggestions] = useState(initialSuggestions)
    const [responses, setResponses] = useState<Record<string, string>>({})

    const handleSaveResponse = async (id: string) => {
        const responseText = responses[id]
        if (!responseText) return

        const result = await respondToSuggestion(id, responseText)
        if (result.success) {
            setSuggestions(prev => prev.map(s =>
                s.id === id ? { ...s, adminResponse: responseText, isReviewed: true } : s
            ))
            alert('Response saved successfully!')
        } else {
            alert(result.error || 'Failed to save response')
        }
    }

    return (
        <div className={styles.suggestionList}>
            {suggestions.length === 0 ? (
                <p>No suggestions found.</p>
            ) : (
                suggestions.map(s => (
                    <div key={s.id} className={`${styles.card} ${s.isReviewed ? styles.reviewed : ''}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.meta}>
                                <span className={styles.tag}>{s.category}</span>
                                <span>{format(new Date(s.createdAt), 'MMM d, yyyy')}</span>
                                <span>👍 {s.upvotes} Votes</span>
                            </div>
                            <h3>{s.title}</h3>
                        </div>

                        <div className={styles.cardBody}>
                            <p className={styles.description}>{s.description}</p>
                            <div className={styles.author}>
                                Submitted by: {s.citizen?.citizenProfile?.fullName || s.citizen?.email}
                                {s.ward && ` in ${s.ward.name}`}
                            </div>
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.responseGroup}>
                                <label>Official Response</label>
                                <textarea
                                    value={responses[s.id] ?? s.adminResponse ?? ''}
                                    onChange={(e) => setResponses(prev => ({ ...prev, [s.id]: e.target.value }))}
                                    placeholder="Add an official response to this suggestion..."
                                    className={styles.textarea}
                                />
                                <button
                                    onClick={() => handleSaveResponse(s.id)}
                                    className={styles.saveBtn}
                                    disabled={responses[s.id] === (s.adminResponse ?? '')}
                                >
                                    {s.isReviewed ? 'Update Response' : 'Save Response'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
