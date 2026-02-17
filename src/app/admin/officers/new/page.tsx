import { getAllWards } from '@/actions/admin'
import OfficerForm from '@/components/admin/OfficerForm'

export default async function NewOfficerPage() {
    const wards = await getAllWards()

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>Add New Ward Officer</h1>
            <OfficerForm wards={wards} />
        </div>
    )
}
