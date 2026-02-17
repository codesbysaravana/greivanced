'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/jwt'
import { revalidatePath } from 'next/cache'

const suggestionSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    wardId: z.string().optional(),
    category: z.string().optional(),
})

export async function createSuggestion(prevState: any, formData: FormData) {
    const session = await getAuthSession()
    if (!session) return { error: 'Not logged in' }

    const data = Object.fromEntries(formData.entries())
    const parsed = suggestionSchema.safeParse(data)

    if (!parsed.success) {
        return { error: 'Invalid input data' }
    }

    const { title, description, wardId, category } = parsed.data

    try {
        await prisma.suggestion.create({
            data: {
                title,
                description,
                wardId: wardId || null,
                category: category || 'General',
                citizenId: session.userId,
            }
        })

        revalidatePath('/citizen/dashboard/suggestions')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to submit suggestion' }
    }
}

export async function getSuggestions(wardId?: string, isReviewed?: boolean) {
    const session = await getAuthSession()
    if (!session) return []

    return await prisma.suggestion.findMany({
        where: {
            ...(wardId ? { wardId } : {}),
            ...(isReviewed !== undefined ? { isReviewed } : {})
        },
        orderBy: { createdAt: 'desc' },
        include: {
            citizen: {
                select: {
                    citizenProfile: { select: { fullName: true } },
                    email: true,
                }
            },
            ward: { select: { name: true } }
        }
    })
}

export async function respondToSuggestion(suggestionId: string, response: string) {
    const session = await getAuthSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    try {
        await prisma.suggestion.update({
            where: { id: suggestionId },
            data: {
                adminResponse: response,
                isReviewed: true,
            }
        })
        revalidatePath('/admin/suggestions')
        revalidatePath('/citizen/dashboard/suggestions')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to respond' }
    }
}


export async function upvoteSuggestion(suggestionId: string) {
    const session = await getAuthSession()
    if (!session) return { error: 'Not logged in' }

    try {
        await prisma.suggestion.update({
            where: { id: suggestionId },
            data: { upvotes: { increment: 1 } }
        })
        revalidatePath('/citizen/dashboard/suggestions')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to upvote' }
    }
}
