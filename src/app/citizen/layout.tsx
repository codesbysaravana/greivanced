import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getAuthSession } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
    const session = await getAuthSession()
    if (!session || session.role !== Role.CITIZEN) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { citizenProfile: true },
    })

    const userName = user?.citizenProfile?.fullName || user?.email || 'Citizen'

    return (
        <DashboardLayout role={Role.CITIZEN} userName={userName}>
            {children}
        </DashboardLayout>
    )
}
