import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables')
}

neonConfig.webSocketConstructor = ws
const adapter = new PrismaNeon({ connectionString })

const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: ['query', 'error', 'warn'],
    })

if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma
