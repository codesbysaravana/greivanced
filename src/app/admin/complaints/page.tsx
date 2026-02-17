import { getAllComplaints, getComplaintsByWard } from '@/actions/admin'
import EscalationControls from '@/components/admin/EscalationControls'
import WardComplaintView from './WardComplaintView'
import styles from './complaints.module.css'

export const dynamic = 'force-dynamic'

export default async function ComplaintsPage() {
    const wardData = await getComplaintsByWard()

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Grievance Audit</h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Browse complaints by ward and monitor resolution progress.
                    </p>
                </div>
                <EscalationControls />
            </div>

            <WardComplaintView wardData={wardData} />
        </div>
    )
}
