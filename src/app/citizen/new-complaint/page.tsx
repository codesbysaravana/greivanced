import { getAllWards } from '@/actions/complaint'
import ComplaintForm from '@/components/complaints/ComplaintForm'

export default async function NewComplaintPage() {
    const wards = await getAllWards()

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>New Complaint</h1>
            <ComplaintForm wards={wards} />
        </div>
    )
}
