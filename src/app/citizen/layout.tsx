import { getAuthSession } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Role } from '@prisma/client'

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
    const session = await getAuthSession()

    if (!session || session.role !== Role.CITIZEN) {
        redirect('/login')
    }

    return (
        <DashboardLayout role={Role.CITIZEN} userName={session.email}>
            {children}
        </DashboardLayout>
    )
}
