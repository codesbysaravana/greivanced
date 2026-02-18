'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/jwt'
import { revalidatePath } from 'next/cache'
import { ComplaintStatus, UrgencyLevel, Role } from '@prisma/client'

// --- Helper: get the authenticated officer's wardId ---
async function getOfficerWardId(wardIdOverride?: string): Promise<{ wardId: string; officerId: string } | null> {
    const session = await getAuthSession()
    if (!session || session.role !== Role.OFFICER) return null

    // Strictly find the officer by session userId
    const officer = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { officerProfile: true },
    })

    if (!officer?.officerProfile?.wardId) return null

    // For development/debugging, we allow wardIdOverride if the officer has permission,
    // but here we strictly return their own wardId to ensure data integrity.
    return { wardId: officer.officerProfile.wardId, officerId: officer.id }
}

// --- READ: Get all complaints for a specific ward ---
export async function getWardComplaints(wardId?: string) {
    const ctx = await getOfficerWardId(wardId)
    if (!ctx) return []

    return await prisma.complaint.findMany({
        where: { wardId: ctx.wardId },
        orderBy: { createdAt: 'desc' },
        include: {
            citizen: {
                select: {
                    email: true,
                    citizenProfile: { select: { fullName: true } },
                },
            },
            category: true,
            ward: { select: { name: true } },
        },
    })
}

// --- Get all wards (for the ward picker in dev mode) ---
export async function getOfficerWards() {
    const wards = await prisma.ward.findMany({
        include: {
            officers: {
                include: {
                    user: {
                        select: { citizenProfile: { select: { fullName: true } } },
                    },
                },
            },
            _count: { select: { complaints: true } },
            district: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
    })

    return wards.map((w) => ({
        id: w.id,
        name: w.name,
        district: w.district?.name || '',
        officerName: w.officers[0]?.user?.citizenProfile?.fullName || 'Unassigned',
        complaintCount: w._count.complaints,
    }))
}

// --- UPDATE: Change complaint status ---
const statusSchema = z.object({
    complaintId: z.string().min(1),
    status: z.nativeEnum(ComplaintStatus),
    remarks: z.string().optional(),
    wardId: z.string().optional(),
})

import { sendStatusUpdateEmail } from '@/lib/mail'

export async function updateComplaintStatus(
    prevState: { error?: string; success?: boolean },
    formData: FormData
) {
    const data = Object.fromEntries(formData.entries())
    const parsed = statusSchema.safeParse(data)
    if (!parsed.success) return { error: 'Invalid data' }

    const { complaintId, status, remarks, wardId } = parsed.data
    const ctx = await getOfficerWardId(wardId)
    if (!ctx) return { error: 'Officer ward not found' }

    try {
        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
            include: { citizen: true }
        })

        if (!complaint) return { error: 'Complaint not found' }
        if (complaint.wardId !== ctx.wardId) return { error: 'Access Denied: Not in your ward' }

        const newDescriptionRaw = remarks
            ? `${complaint.descriptionRaw}\n\n[${new Date().toISOString()}] Officer Remark: ${remarks}`
            : undefined

        await prisma.complaint.update({
            where: { id: complaintId },
            data: {
                currentStatus: status,
                lastStatusChangedAt: new Date(),
                ...(newDescriptionRaw ? { descriptionRaw: newDescriptionRaw } : {}),
            },
        })

        // TRIGGER EMAIL: Only for important status changes
        if (complaint.citizen?.email && (status === 'RESOLVED' || status === 'REJECTED' || status === 'IN_PROGRESS')) {
            console.log(`[OfficerAction] Triggering email to ${complaint.citizen.email} for status: ${status}`)
            // We use a non-blocking call or await depending on preference. Awaiting for reliability here.
            await sendStatusUpdateEmail({
                to: complaint.citizen.email,
                subject: `Greivanced: Your complaint has been updated to ${status}`,
                title: complaint.title,
                description: complaint.descriptionRaw,
                status: status,
                remarks: remarks as string | undefined
            })
        }

        revalidatePath('/officer/dashboard')
        revalidatePath('/citizen/dashboard')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to update status' }
    }
}

// --- UPDATE: Edit complaint details ---
const editSchema = z.object({
    complaintId: z.string().min(1),
    title: z.string().min(3),
    description: z.string().min(5),
    urgency: z.nativeEnum(UrgencyLevel),
    wardId: z.string().optional(),
})

export async function editComplaint(
    prevState: { error?: string; success?: boolean },
    formData: FormData
) {
    const data = Object.fromEntries(formData.entries())
    const parsed = editSchema.safeParse(data)
    if (!parsed.success) return { error: 'Invalid data' }

    const { complaintId, title, description, urgency, wardId } = parsed.data
    const ctx = await getOfficerWardId(wardId)
    if (!ctx) return { error: 'Officer ward not found' }

    try {
        const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } })
        if (!complaint) return { error: 'Complaint not found' }
        if (complaint.wardId !== ctx.wardId) return { error: 'Access Denied: Not in your ward' }

        await prisma.complaint.update({
            where: { id: complaintId },
            data: {
                title,
                descriptionRaw: description,
                urgencyLevel: urgency,
            },
        })

        revalidatePath('/officer/dashboard')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to edit complaint' }
    }
}

// --- DELETE: Remove complaint (soft or hard) ---
export async function deleteComplaint(complaintId: string, wardId?: string) {
    const ctx = await getOfficerWardId(wardId)
    if (!ctx) return { error: 'Officer ward not found' }

    try {
        const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } })
        if (!complaint) return { error: 'Complaint not found' }
        if (complaint.wardId !== ctx.wardId) return { error: 'Access Denied: Not in your ward' }

        await prisma.complaint.delete({ where: { id: complaintId } })

        revalidatePath('/officer/dashboard')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to delete complaint' }
    }
}
