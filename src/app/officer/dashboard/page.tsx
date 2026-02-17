import { getWardComplaints, getOfficerWards } from '@/actions/officer'
import OfficerDashboardClient from '@/components/officer/OfficerDashboardClient'
import { getAuthSession } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function OfficerDashboard() {
    const session = await getAuthSession()
    if (!session || session.role !== Role.OFFICER) {
        redirect('/login')
    }

    const officer = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { officerProfile: { include: { ward: true } } },
    })

    if (!officer?.officerProfile?.wardId) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>No Ward Assigned</h1>
                <p>Please contact an administrator to assign you to a ward.</p>
            </div>
        )
    }

    const wardId = officer.officerProfile.wardId
    const complaints = await getWardComplaints(wardId)
    const wards = await getOfficerWards() // We can still pass all wards if we want the selector for admins, but for /officer prefix it's better to just show the assigned one.
    // For now, let's filter wards to only own ward to clean up the UI
    const myWard = wards.filter(w => w.id === wardId)

    return (
        <OfficerDashboardClient
            wards={myWard}
            complaints={complaints}
            selectedWardId={wardId}
        />
    )
}
