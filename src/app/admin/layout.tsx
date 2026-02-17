import { getAuthSession } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Role } from '@prisma/client'

// Force this route segment (and children) to be dynamic so that
// Prisma/database access only happens at request time, not during `next build`.
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
