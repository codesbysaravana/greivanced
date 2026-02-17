import { prisma } from './prisma'




/**
 * Checks for complaints that need to be escalated.
 * Rules:
 * - Assigned to an officer
 * - Status is PENDING or IN_PROGRESS
 * - Assigned more than 30 hours ago
 * - Not yet escalated for this specific delay
 */
export async function checkAndEscalateComplaints() {
    const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000)

    const stalledComplaints = await prisma.complaint.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { currentStatus: 'PENDING' },
                        { currentStatus: 'IN_PROGRESS' }
                    ]
                },
                {
                    assignments: {
                        some: {
                            assignedAt: { lt: thirtyHoursAgo },
                            isActive: true
                        }
                    }
                },
                {
                    escalations: {
                        none: {}
                    }
                }
            ]
        },
        include: {
            assignments: { where: { isActive: true } }
        }
    })

    let count = 0
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (!admin) return 0

    for (const complaint of stalledComplaints) {
        const officerAssignment = complaint.assignments[0]
        if (!officerAssignment) continue

        await prisma.complaintEscalation.create({
            data: {
                complaintId: complaint.id,
                escalatedFrom: officerAssignment.officerId,
                escalatedTo: admin.id,
                reason: 'Auto-escalation: No resolution in 30 hours'
            }
        })
        count++
    }

    return count
}
