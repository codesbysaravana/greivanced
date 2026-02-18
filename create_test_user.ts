
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'c.saravanapriyan3@gmail.com'
    const password = 'password'

    // Check if user exists
    const existing = await prisma.user.findUnique({
        where: { email }
    })

    if (existing) {
        console.log(`User ${email} already exists. ID: ${existing.id}`)
        // Update password just in case
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.update({
            where: { email },
            data: { passwordHash: hashedPassword }
        })
        console.log('Password updated to "password"')
        return
    }

    console.log(`Creating user ${email}...`)
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: hashedPassword,
            role: Role.CITIZEN,
            isActive: true,
            citizenProfile: {
                create: {
                    fullName: 'Test User'
                }
            }
        }
    })

    console.log(`User created! ID: ${user.id}`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
