import { getAuthSession } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function OfficerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getAuthSession()

    if (!session || session.role !== Role.OFFICER) {
        redirect('/login')
    }

    return (
        <DashboardLayout role={Role.OFFICER} userName={session.email}>
            {children}
        </DashboardLayout>
    )
}
