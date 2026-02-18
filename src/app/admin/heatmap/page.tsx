import { getWardComplaintStats, getCityComplaintHeatmap } from '@/actions/complaint'
import Heatmap from '@/components/admin/Heatmap'

export const dynamic = 'force-dynamic'

export default async function HeatmapPage() {
    const stats = await getWardComplaintStats()
    const history = await getCityComplaintHeatmap()

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Silent Zones & Complaint Heatmap</h1>
                <p style={{ color: '#666', fontSize: '1.1rem' }}>
                    Visualizing complaint intensity across wards to identify high-activity areas and silent zones.
                </p>
            </div>

            <Heatmap data={stats} history={history} />
        </div>
    )
}
