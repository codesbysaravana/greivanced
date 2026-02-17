import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function checkUser(email: string, password: string) {
    console.log(`🔍 Verifying: ${email}`)
    const user = await prisma.user.findUnique({
        where: { email },
        include: { officerProfile: { include: { ward: true } } }
    })

    if (!user) {
        console.log(`❌ User ${email} not found`)
        return
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    console.log(`✅ User found: ${user.email}`)
    console.log(`🎭 Role: ${user.role}`)
    console.log(`🔑 Auth Match: ${ok ? 'YES' : 'NO'}`)
    if (user.officerProfile) {
        console.log(`🏠 Ward: ${user.officerProfile.ward?.name || 'None'}`)
    }
    console.log('---------------------------')
}

async function main() {
    await checkUser('superadmin@gov.in', 'SuperPassword2026')
    await checkUser('officer.chennai@gov.in', 'SuperPassword2026')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
