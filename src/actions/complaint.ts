'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/jwt'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { UrgencyLevel } from '@prisma/client'

const complaintSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    address: z.string().optional(),
    wardId: z.string().min(1, 'Please select a ward'),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    category: z.string().min(1, 'Please select a category'),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    isAnonymous: z.coerce.boolean().optional(),
})

export type ComplaintState = {
    error?: string
    success?: boolean
}

export async function createComplaint(prevState: ComplaintState, formData: FormData): Promise<ComplaintState> {
    const session = await getAuthSession()
    if (!session) {
        return { error: 'Not logged in' }
    }

    const data = Object.fromEntries(formData.entries())
    console.log('Form data received:', data)

    const parsed = complaintSchema.safeParse(data)

    if (!parsed.success) {
        console.log('Validation errors:', parsed.error.flatten())
        const fieldErrors = parsed.error.flatten().fieldErrors
        const firstError = Object.entries(fieldErrors)
            .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
            .join('; ')
        return { error: firstError || 'Invalid form data' }
    }

    const { title, description, address, wardId, latitude, longitude, category, urgency, isAnonymous } = parsed.data

    try {
        const citizenId = session.userId

        const complaint = await prisma.complaint.create({
            data: {
                title,
                descriptionRaw: description,
                address: address || null,
                categoryId: category,
                urgencyLevel: urgency as UrgencyLevel,
                anonymousFlag: isAnonymous || false,
                citizenId,
                wardId,
            },
        })

        if (latitude && longitude) {
            try {
                await prisma.$executeRaw`
                UPDATE "complaints"
                SET geo_point = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
                WHERE id = ${complaint.id}::uuid
            `
            } catch (geoError) {
                console.warn('Could not set geo_point (PostGIS might not be available):', geoError)
            }
        }

        revalidatePath('/citizen/dashboard')

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error)
        console.error('Complaint creation error:', errMsg)
        return { error: `Failed: ${errMsg.substring(0, 200)}` }
    }

    redirect('/citizen/dashboard')
}

export async function getCitizenComplaints() {
    const session = await getAuthSession()
    if (!session) return []

    return await prisma.complaint.findMany({
        where: { citizenId: session.userId },
        orderBy: { createdAt: 'desc' },
        include: { ward: true, category: true },
        take: 50
    })
}

export async function getAllWards() {
    return await prisma.ward.findMany({
        select: { id: true, name: true }
    })
}

export async function getAllCategories() {
    return await prisma.complaintCategory.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    })
}

export async function getComplaintsWithTracking() {
    const session = await getAuthSession()
    if (!session) return []

    return await prisma.complaint.findMany({
        where: { citizenId: session.userId },
        orderBy: { createdAt: 'desc' },
        include: {
            ward: true,
            category: true,
            assignments: {
                where: { isActive: true },
                include: {
                    officer: {
                        include: { citizenProfile: true }
                    }
                }
            }
        },
        take: 50
    })
}

export async function getWardComplaintStats() {
    const wards = await prisma.ward.findMany({
        include: {
            _count: {
                select: { complaints: true }
            },
            complaints: {
                select: { currentStatus: true }
            },
            district: {
                select: { name: true }
            }
        },
        orderBy: { name: 'asc' }
    })

    return wards.map(ward => {
        const statusCounts = {
            PENDING: 0,
            IN_PROGRESS: 0,
            RESOLVED: 0,
            REJECTED: 0,
            CLOSED: 0,
        }
        ward.complaints.forEach(c => {
            if (c.currentStatus && c.currentStatus in statusCounts) {
                statusCounts[c.currentStatus as keyof typeof statusCounts]++
            }
        })
        return {
            id: ward.id,
            name: ward.name,
            district: ward.district?.name || '',
            total: ward._count.complaints,
            ...statusCounts,
        }
    })
}
