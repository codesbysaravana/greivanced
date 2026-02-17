import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Adding custom Admin, Ward, and Officer...')

    const passwordHash = await bcrypt.hash('SuperPassword2026', 12)

    // 1. Get District
    const existingDistrict = await prisma.district.findFirst({ where: { name: 'Chennai' } })
    const districtId = existingDistrict ? existingDistrict.id : (await prisma.district.create({ data: { name: 'Chennai' } })).id
    console.log(`✅ District: Chennai (${districtId})`)

    // 2. Create/Get Ward
    const wardName = 'Chennai-Central'
    const ward = await prisma.ward.findFirst({ where: { name: wardName } })
    const wardId = ward ? ward.id : (await prisma.ward.create({
        data: {
            name: wardName,
            districtId: districtId,
            population: 25000
        }
    })).id
    console.log(`✅ Ward: ${wardName} (${wardId})`)

    // 3. Create Admin
    const adminEmail = 'superadmin@gov.in'
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: { passwordHash: passwordHash, role: Role.ADMIN },
        create: {
            email: adminEmail,
            passwordHash: passwordHash,
            role: Role.ADMIN,
            isActive: true,
        },
    })
    console.log(`✅ Admin: ${adminEmail}`)

    // 4. Create Officer
    const officerEmail = 'officer.chennai@gov.in'
    await prisma.user.upsert({
        where: { email: officerEmail },
        update: {
            passwordHash: passwordHash,
            role: Role.OFFICER,
            officerProfile: {
                upsert: {
                    create: { wardId: wardId, designation: 'Senior Ward Officer' },
                    update: { wardId: wardId }
                }
            },
            citizenProfile: {
                upsert: {
                    create: { fullName: 'Chennai Officer' },
                    update: { fullName: 'Chennai Officer' }
                }
            }
        },
        create: {
            email: officerEmail,
            passwordHash: passwordHash,
            role: Role.OFFICER,
            isActive: true,
            officerProfile: {
                create: {
                    wardId: wardId,
                    designation: 'Senior Ward Officer'
                }
            },
            citizenProfile: {
                create: {
                    fullName: 'Chennai Officer'
                }
            }
        },
    })
    console.log(`✅ Officer: ${officerEmail} (Assigned to ${wardName})`)

    // 5. Create Citizen
    const citizenEmail = 'citizen@gov.in'
    await prisma.user.upsert({
        where: { email: citizenEmail },
        update: { passwordHash: passwordHash, role: Role.CITIZEN },
        create: {
            email: citizenEmail,
            passwordHash: passwordHash,
            role: Role.CITIZEN,
            isActive: true,
            citizenProfile: {
                create: { fullName: 'Regular Citizen' }
            }
        },
    })
    console.log(`✅ Citizen: ${citizenEmail}`)

    console.log('\n✨ Custom Seed Successful!')
    console.log('---------------------------')
    console.log('Admin:   superadmin@gov.in / SuperPassword2026')
    console.log('Officer: officer.chennai@gov.in / SuperPassword2026')
    console.log('Citizen: citizen@gov.in / SuperPassword2026')
    console.log('Ward:    Chennai-Central')
    console.log('---------------------------')
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
