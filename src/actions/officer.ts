'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/jwt'
import { revalidatePath } from 'next/cache'
import { Role, ComplaintStatus } from '@prisma/client'

export async function getAssignedComplaints() {
    const session = await getAuthSession()
    if (!session || session.role !== Role.OFFICER) {
        return []
    }

    // Get Officer's wardId and ID
    const officer = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { officerProfile: true }
    })

    if (!officer?.officerProfile?.wardId) return []

    return await prisma.complaint.findMany({
        where: {
            OR: [
                { wardId: officer.officerProfile.wardId },
                { assignments: { some: { officerId: session.userId, isActive: true } } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
            citizen: {
                select: {
                    email: true,
                    citizenProfile: { select: { fullName: true } }
                }
            },
            category: true
        }
    })
}

const statusSchema = z.object({
    complaintId: z.string(),
    status: z.nativeEnum(ComplaintStatus), // PENDING, IN_PROGRESS, RESOLVED, REJECTED
    remarks: z.string().optional()
})

export async function updateComplaintStatus(prevState: { error?: string, success?: boolean }, formData: FormData) {
    const session = await getAuthSession()
    if (!session || session.role !== Role.OFFICER) {
        return { error: 'Unauthorized' }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = statusSchema.safeParse(data)

    if (!parsed.success) return { error: 'Invalid data' }

    const { complaintId, status, remarks } = parsed.data

    try {
        const officer = await prisma.user.findUnique({ where: { id: session.userId }, include: { officerProfile: true } })
        const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } })

        if (!officer?.officerProfile?.wardId || complaint?.wardId !== officer.officerProfile.wardId) {
            return { error: 'Access Denied: Not in your ward' }
        }

        const newDescriptionRaw = remarks ?
            `${complaint?.descriptionRaw}\n\n[${new Date().toISOString()}] Officer Remark: ${remarks}` :
            undefined

        await prisma.complaint.update({
            where: { id: complaintId },
            data: {
                currentStatus: status,
                lastStatusChangedAt: new Date(),
                descriptionRaw: newDescriptionRaw
            }
        })

        revalidatePath('/officer/dashboard')
        return { success: true }

    } catch (e) {
        console.error(e)
        return { error: 'Failed to update' }
    }
}
