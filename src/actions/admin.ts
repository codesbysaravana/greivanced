'use server'

import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/jwt'
import { UserRole } from '@/lib/rbac'
import { Role, ComplaintStatus } from '@prisma/client'
import { hashPassword } from '@/lib/auth'
import { checkAndEscalateComplaints } from '@/lib/escalation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendStatusUpdateEmail } from '@/lib/mail'

// --- Auth Helper ---
async function checkAdmin() {
    const session = await getAuthSession()
    return session && session.role === UserRole.ADMIN
}

// --- Dashboard Stats ---
export async function getDashboardStats() {
    if (!(await checkAdmin())) return null

    const [
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        resolvedComplaints,
        rejectedComplaints,
        totalOfficers
    ] = await Promise.all([
        prisma.complaint.count(),
        prisma.complaint.count({ where: { currentStatus: ComplaintStatus.PENDING } }),
        prisma.complaint.count({ where: { currentStatus: ComplaintStatus.IN_PROGRESS } }),
        prisma.complaint.count({ where: { currentStatus: ComplaintStatus.RESOLVED } }),
        prisma.complaint.count({ where: { currentStatus: ComplaintStatus.REJECTED } }),
        prisma.user.count({ where: { role: Role.OFFICER } })
    ])

    const totalWards = await prisma.ward.count()

    return {
        totalComplaints,
        pending: pendingComplaints,
        inProgress: inProgressComplaints,
        resolved: resolvedComplaints,
        rejected: rejectedComplaints,
        totalOfficers,
        totalWards
    }
}

// --- Complaints ---
export async function getAllComplaints() {
    if (!(await checkAdmin())) return []

    return await prisma.complaint.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            ward: true,
            assignments: {
                where: { isActive: true },
                include: { officer: { include: { citizenProfile: true } } }
            },
            citizen: {
                include: { citizenProfile: true }
            },
            category: true
        },
        take: 100
    })
}

export async function getComplaintsByWard() {
    if (!(await checkAdmin())) return []

    return await prisma.ward.findMany({
        include: {
            complaints: {
                orderBy: { createdAt: 'desc' },
                include: {
                    assignments: {
                        where: { isActive: true },
                        include: { officer: { include: { citizenProfile: true } } }
                    },
                    citizen: {
                        include: { citizenProfile: true }
                    },
                    category: true
                }
            }
        },
        orderBy: { name: 'asc' }
    })
}

export async function getWardMetrics() {
    if (!(await checkAdmin())) return []
    const metrics = await prisma.complaint.groupBy({
        by: ['wardId'],
        _count: { id: true }
    })
    const wards = await prisma.ward.findMany()
    const wardMap = new Map(wards.map(w => [w.id, w.name]))
    return metrics.map(m => ({
        wardId: m.wardId,
        wardName: m.wardId ? wardMap.get(m.wardId) : 'Unassigned',
        count: m._count.id
    })).sort((a, b) => b.count - a.count)
}

// --- Officers ---
export async function getAllOfficers() {
    if (!(await checkAdmin())) return []
    return await prisma.user.findMany({
        where: { role: Role.OFFICER },
        include: {
            officerProfile: { include: { ward: true } },
            citizenProfile: true
        },
        orderBy: { createdAt: 'desc' }
    })
}

const officerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    wardId: z.string().min(1)
})

export async function createOfficer(prevState: { error?: string, success?: boolean }, formData: FormData) {
    if (!(await checkAdmin())) return { error: 'Unauthorized' }

    const data = Object.fromEntries(formData.entries())
    const parsed = officerSchema.safeParse(data)

    if (!parsed.success) return { error: 'Invalid data' }

    const { name, email, password, wardId } = parsed.data

    try {
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) return { error: 'Email already exists' }

        const hashedPassword = await hashPassword(password)

        await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role: Role.OFFICER,
                officerProfile: {
                    create: {
                        wardId,
                        designation: 'Ward Officer'
                    }
                },
                citizenProfile: {
                    create: {
                        fullName: name
                    }
                },
                isActive: true
            }
        })

        revalidatePath('/admin/officers')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to create officer' }
    }
}

export async function deleteOfficer(officerId: string) {
    if (!(await checkAdmin())) return { error: 'Unauthorized' }
    try {
        await prisma.user.delete({ where: { id: officerId } })
        revalidatePath('/admin/officers')
        return { success: true }
    } catch (error) {
        console.error('Delete officer failed:', error)
        return { error: 'Failed to delete' }
    }
}

// --- Wards ---
export async function getAllWards() {
    // Public or Admin? Admin mostly. But complaints form uses public one.
    // This is specific for Admin view if detail needed.
    if (!(await checkAdmin())) return []
    return await prisma.ward.findMany({
        include: {
            district: true,
            _count: {
                select: { officers: true, complaints: true }
            }
        }
    })
}

// --- Escalation ---
export async function runEscalationCheck(): Promise<{ error?: string; success?: boolean; count?: number }> {
    if (!(await checkAdmin())) return { error: 'Unauthorized' }
    try {
        const count = await checkAndEscalateComplaints()
        revalidatePath('/admin/dashboard')
        revalidatePath('/admin/complaints')
        return { success: true, count }
    } catch (e) {
        console.error(e)
        return { error: 'Escalation check failed' }
    }
}
// --- Clean Checks ---
export async function getUrgentComplaints() {
    if (!(await checkAdmin())) return null

    const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000)

    const [criticalIssues, stalledIssues] = await Promise.all([
        // 1. Critical issues (not resolved/rejected)
        prisma.complaint.findMany({
            where: {
                urgencyLevel: 'CRITICAL',
                NOT: {
                    currentStatus: { in: [ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED] }
                }
            },
            include: {
                ward: true,
                category: true,
                assignments: {
                    where: { isActive: true },
                    include: { officer: { include: { citizenProfile: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        // 2. Issues older than 30 hours (not resolved/rejected)
        prisma.complaint.findMany({
            where: {
                createdAt: { lt: thirtyHoursAgo },
                NOT: {
                    currentStatus: { in: [ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED] }
                }
            },
            include: {
                ward: true,
                category: true,
                assignments: {
                    where: { isActive: true },
                    include: { officer: { include: { citizenProfile: true } } }
                }
            },
            orderBy: { createdAt: 'asc' }
        })
    ])

    return {
        critical: criticalIssues,
        stalled: stalledIssues
    }
}
// --- Global Administrative Control ---
const adminStatusSchema = z.object({
    complaintId: z.string().min(1),
    status: z.nativeEnum(ComplaintStatus),
    remarks: z.string().optional()
})

export async function adminUpdateComplaintStatus(
    prevState: { error?: string; success?: boolean },
    formData: FormData
) {
    if (!(await checkAdmin())) return { error: 'Unauthorized' }

    const data = Object.fromEntries(formData.entries())
    const parsed = adminStatusSchema.safeParse(data)
    if (!parsed.success) return { error: 'Invalid data' }

    const { complaintId, status, remarks } = parsed.data

    try {
        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
            include: { citizen: true }
        })

        if (!complaint) return { error: 'Complaint not found' }

        const newDescriptionRaw = remarks
            ? `${complaint.descriptionRaw}\n\n[${new Date().toISOString()}] ADMIN OVERRIDE: ${remarks}`
            : undefined

        await prisma.complaint.update({
            where: { id: complaintId },
            data: {
                currentStatus: status,
                lastStatusChangedAt: new Date(),
                ...(newDescriptionRaw ? { descriptionRaw: newDescriptionRaw } : {}),
            },
        })

        // TRIGGER EMAIL:
        if (complaint.citizen?.email && (status === 'RESOLVED' || status === 'REJECTED')) {
            console.log(`[AdminAction] Triggering email to ${complaint.citizen.email} for status: ${status}`)
            await sendStatusUpdateEmail({
                to: complaint.citizen.email,
                subject: `CivicResolve: Administrative Update - Your grievance is now ${status}`,
                title: complaint.title,
                description: complaint.descriptionRaw,
                status: status,
                remarks: remarks
            })
        }

        revalidatePath('/admin/dashboard')
        revalidatePath('/admin/complaints')
        revalidatePath('/citizen/dashboard')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Admin update failed' }
    }
}
