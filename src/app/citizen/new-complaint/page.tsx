import { getAllWards, getAllCategories } from '@/actions/complaint'
import ComplaintForm from '@/components/complaints/ComplaintForm'
import styles from './new-complaint.module.css'
import { AlertCircle, Terminal, HelpCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewComplaintPage() {
    const [wards, categories] = await Promise.all([
        getAllWards(),
        getAllCategories()
    ])

    const isSystemConfigured = wards.length > 0 && categories.length > 0

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Submit a Grievance</h1>
                <p className={styles.subtitle}>
                    Help us improve our city. Report issues like potholes, street lights, or sanitation problems directly to ward officers.
                </p>
            </header>

            {!isSystemConfigured && (
                <div className={styles.alert}>
                    <div className={styles.alertTitle}>
                        <AlertCircle size={20} />
                        Important: System Not Yet Configured
                    </div>
                    <p>
                        The application requires administrative data (Wards & Categories) to be seeded.
                        Please ask your administrator to run the following command in the project root:
                    </p>
                    <div style={{ marginTop: '0.5rem' }}>
                        <span className={styles.alertCode}><Terminal size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> npx prisma db seed</span>
                    </div>
                </div>
            )}

            <div className={styles.formBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                    <HelpCircle size={18} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Please fill out the form accurately</span>
                </div>
                <ComplaintForm wards={wards} categories={categories} />
            </div>
        </div>
    )
}
