'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/jwt'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Role, UrgencyLevel } from '@prisma/client'

const complaintSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    address: z.string().optional(),
    wardId: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    category: z.string(),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    isAnonymous: z.coerce.boolean().optional(),
})

export type ComplaintState = {
    error?: string
    success?: boolean
}

export async function createComplaint(prevState: ComplaintState, formData: FormData): Promise<ComplaintState> {
    const session = await getAuthSession()
    if (!session || session.role !== Role.CITIZEN) {
        return { error: 'Unauthorized' }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = complaintSchema.safeParse(data)

    if (!parsed.success) {
        return { error: 'Invalid form data' }
    }

    const { title, description, address, wardId, latitude, longitude, category, urgency, isAnonymous } = parsed.data

    try {
        // 1. Determine Ward
        let assignedWardId = wardId

        // If lat/lng provided, try to find ward via PostGIS
        if (latitude && longitude && !assignedWardId) {
            // Find ward containing this point
            // spatial query
            const wards = await prisma.$queryRaw<{ id: string }[]>`
            SELECT id FROM "wards"
            WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
            LIMIT 1
        `
            if (wards.length > 0) {
                assignedWardId = wards[0].id
            }
        }

        if (!assignedWardId) {
            return { error: 'Could not determine ward from location' }
        }

        const complaint = await prisma.complaint.create({
            data: {
                title,
                descriptionRaw: description,
                address,
                categoryId: category,
                urgencyLevel: urgency as UrgencyLevel,
                anonymousFlag: isAnonymous || false,
                citizenId: session.userId,
                wardId: assignedWardId,
            },
        })

        if (latitude && longitude) {
            await prisma.$executeRaw`
            UPDATE "complaints"
            SET geo_point = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
            WHERE id = ${complaint.id}::uuid
        `
        }

        revalidatePath('/citizen/dashboard')

    } catch (error) {
        console.error('Complaint creation error:', error)
        return { error: 'Failed to submit complaint' }
    }

    redirect('/citizen/dashboard')
}

export async function getCitizenComplaints() {
    const session = await getAuthSession()
    if (!session) return []

    return await prisma.complaint.findMany({
        where: { citizenId: session.userId },
        orderBy: { createdAt: 'desc' },
        include: { ward: true, category: true }
    })
}

export async function getAllWards() {
    return await prisma.ward.findMany({
        select: { id: true, name: true }
    })
}
