'use client'

import { useActionState, useState } from 'react'
import { createSuggestion } from '@/actions/suggestion'
import styles from './suggestions.module.css'

const initialState: { error?: string; success?: boolean } = {}

export default function SuggestionForm({ wards }: { wards: any[] }) {
    const [state, formAction, isPending] = useActionState(createSuggestion, initialState)

    return (
        <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Submit a New Suggestion</h2>
            <form action={formAction} className={styles.form}>
                <div className={styles.inputGroup}>
                    <label htmlFor="title">Title</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        placeholder="E.g., Solar panels for street lights"
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="category">Category</label>
                    <select id="category" name="category" className={styles.select}>
                        <option value="General">General</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Sanitation">Sanitation</option>
                        <option value="Safety">Safety</option>
                        <option value="Greenspace">Greenspace</option>
                    </select>
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="wardId">Specific Ward (Optional)</label>
                    <select id="wardId" name="wardId" className={styles.select}>
                        <option value="">All City / General</option>
                        {wards.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        placeholder="Detail your idea to improve our city..."
                        required
                        className={styles.textarea}
                    />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isPending}>
                    {isPending ? 'Submitting...' : 'Post Suggestion'}
                </button>

                {state?.error && <p className={styles.error} style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{state.error}</p>}
                {state?.success && <p className={styles.success} style={{ color: 'green', marginTop: '1rem', textAlign: 'center' }}>Successfully submitted!</p>}
            </form>
        </div>
    )
}
