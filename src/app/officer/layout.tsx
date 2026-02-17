import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getAuthSession } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function OfficerLayout({ children }: { children: React.ReactNode }) {
    const session = await getAuthSession()
    if (!session || session.role !== Role.OFFICER) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            citizenProfile: true,
            officerProfile: { include: { ward: true } },
        },
    })

    const userName = user?.citizenProfile?.fullName || user?.email || 'Officer'

    return (
        <DashboardLayout role={Role.OFFICER} userName={userName}>
            {children}
        </DashboardLayout>
    )
}
