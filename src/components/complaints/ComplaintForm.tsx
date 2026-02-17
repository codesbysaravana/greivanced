'use client'

import { useActionState, useState } from 'react'
import { createComplaint } from '@/actions/complaint'
import styles from './ComplaintForm.module.css'

interface Ward {
    id: string
    name: string
}

const initialState = {
    error: '',
}

export default function ComplaintForm({ wards }: { wards: Ward[] }) {
    const [state, formAction, isPending] = useActionState(createComplaint, initialState)
    const [locationStatus, setLocationStatus] = useState<string>('')
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null)

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('Geolocation is not supported by your browser')
            return
        }

        setLocationStatus('Locating...')
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
                setLocationStatus('Location acquired!')
            },
            (error) => {
                setLocationStatus('Unable to retrieve your location')
                console.error(error)
            }
        )
    }

    return (
        <form action={formAction} className={styles.form}>
            {state?.error && <div className={styles.error}>{state.error}</div>}

            <div className={styles.formGroup}>
                <label htmlFor="title" className={styles.label}>Title</label>
                <input name="title" id="title" required minLength={5} className={styles.input} placeholder="e.g. Broken Streetlight" />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>Description</label>
                <textarea name="description" id="description" required minLength={10} className={styles.textarea} placeholder="Describe the issue in detail..." />
            </div>

            <div className={styles.row}>
                <div className={styles.formGroup}>
                    <label htmlFor="category" className={styles.label}>Category</label>
                    <select name="category" id="category" className={styles.select}>
                        <option value="Sanitation">Sanitation</option>
                        <option value="Roads">Roads</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Water">Water Supply</option>
                        <option value="Health">Health</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="urgency" className={styles.label}>Urgency</label>
                    <select name="urgency" id="urgency" className={styles.select}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                    </select>
                </div>
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="address" className={styles.label}>Address (Optional)</label>
                <input name="address" id="address" className={styles.input} placeholder="Street address or landmark" />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Location</label>
                <button type="button" onClick={handleGetLocation} className={styles.locationBtn}>
                    Get Current Location
                </button>
                {locationStatus && <p className={styles.locationStatus}>{locationStatus}</p>}
                {coords && (
                    <>
                        <input type="hidden" name="latitude" value={coords.lat} />
                        <input type="hidden" name="longitude" value={coords.lng} />
                    </>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="wardId" className={styles.label}>Ward (Optional if location provided)</label>
                <select name="wardId" id="wardId" className={styles.select}>
                    <option value="">-- Select Ward --</option>
                    {wards.map(ward => (
                        <option key={ward.id} value={ward.id}>{ward.name}</option>
                    ))}
                </select>
            </div>

            <div className={styles.checkboxGroup}>
                <input type="checkbox" name="isAnonymous" id="isAnonymous" value="true" />
                <label htmlFor="isAnonymous">Submit Anonymously</label>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isPending}>
                {isPending ? 'Submitting...' : 'Submit Complaint'}
            </button>
        </form>
    )
}
