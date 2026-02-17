import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getAuthSession } from '@/lib/jwt'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getAuthSession()
    if (!session || session.role !== Role.ADMIN) {
        redirect('/login')
    }

    return (
        <DashboardLayout role={Role.ADMIN} userName={session.email}>
            {children}
        </DashboardLayout>
    )
}
