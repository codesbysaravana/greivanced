import { PrismaClient, Role, DepartmentType } from '@prisma/client'
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
    console.log('🌱 Starting seed...')

    const password = await bcrypt.hash('password123', 10)

    // 1. Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@gov.in' },
        update: {},
        create: {
            email: 'admin@gov.in',
            passwordHash: password,
            role: Role.ADMIN,
            isActive: true,
        },
    })
    console.log(`✅ Admin: ${admin.email}`)

    // 2. Create a Citizen user
    const citizen = await prisma.user.upsert({
        where: { email: 'citizen@example.com' },
        update: {},
        create: {
            email: 'citizen@example.com',
            passwordHash: password,
            role: Role.CITIZEN,
            isActive: true,
            citizenProfile: {
                create: {
                    fullName: 'Test Citizen',
                },
            },
        },
    })
    console.log(`✅ Citizen: ${citizen.email}`)

    // 3. Create Districts
    const districtNames = ['Central', 'North', 'South', 'East', 'West']
    const districts: { id: string; name: string }[] = []

    for (const name of districtNames) {
        const district = await prisma.district.upsert({
            where: { id: (await prisma.district.findFirst({ where: { name } }))?.id || '00000000-0000-0000-0000-000000000000' },
            update: {},
            create: { name },
        })
        districts.push(district)
        console.log(`✅ District: ${district.name}`)
    }

    // 4. Create Wards (2 per district)
    const wards: { id: string; name: string }[] = []

    for (const district of districts) {
        for (let i = 1; i <= 2; i++) {
            const wardName = `${district.name}-Ward-${i}`
            const existing = await prisma.ward.findFirst({ where: { name: wardName } })

            if (existing) {
                wards.push(existing)
                console.log(`  ↳ Ward exists: ${wardName}`)
            } else {
                const ward = await prisma.ward.create({
                    data: {
                        name: wardName,
                        districtId: district.id,
                        population: Math.floor(Math.random() * 50000) + 10000,
                    },
                })
                wards.push(ward)
                console.log(`  ✅ Ward: ${wardName}`)
            }
        }
    }

    // 5. Create Officers (one per ward)
    for (const ward of wards) {
        const officerEmail = `officer.${ward.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gov.in`

        await prisma.user.upsert({
            where: { email: officerEmail },
            update: {},
            create: {
                email: officerEmail,
                passwordHash: password,
                role: Role.OFFICER,
                isActive: true,
                officerProfile: {
                    create: {
                        wardId: ward.id,
                        designation: 'Ward Officer',
                    },
                },
                citizenProfile: {
                    create: {
                        fullName: `Officer ${ward.name}`,
                    },
                },
            },
        })
        console.log(`  ✅ Officer: ${officerEmail}`)
    }

    // 6. Create Departments & Categories
    const departmentsData: { name: string; type: DepartmentType; categories: string[] }[] = [
        {
            name: 'Roads & Infrastructure',
            type: DepartmentType.INFRASTRUCTURE,
            categories: ['Potholes', 'Broken Streetlights', 'Damaged Footpath', 'Traffic Signal Issue'],
        },
        {
            name: 'Sanitation & Waste',
            type: DepartmentType.SANITATION,
            categories: ['Garbage Collection', 'Open Drains', 'Public Toilet Maintenance', 'Illegal Dumping'],
        },
        {
            name: 'Water Supply',
            type: DepartmentType.WATER_SUPPLY,
            categories: ['No Water Supply', 'Contaminated Water', 'Leaking Pipeline', 'Low Water Pressure'],
        },
        {
            name: 'Electricity',
            type: DepartmentType.ELECTRICITY,
            categories: ['Power Outage', 'Exposed Wires', 'Faulty Transformer', 'Street Light Not Working'],
        },
        {
            name: 'Health & Hygiene',
            type: DepartmentType.HEALTH,
            categories: ['Mosquito Breeding', 'Stagnant Water', 'Unclean Hospital', 'Food Safety Violation'],
        },
        {
            name: 'Transport',
            type: DepartmentType.TRANSPORT,
            categories: ['Bus Route Issue', 'Missing Bus Stop', 'Road Safety Concern'],
        },
        {
            name: 'General Administration',
            type: DepartmentType.GENERAL_ADMIN,
            categories: ['Noise Complaint', 'Encroachment', 'Unauthorized Construction', 'Other'],
        },
    ]

    for (const dept of departmentsData) {
        const existing = await prisma.department.findFirst({ where: { name: dept.name } })
        let departmentId: string

        if (existing) {
            departmentId = existing.id
            console.log(`  ↳ Department exists: ${dept.name}`)
        } else {
            const department = await prisma.department.create({
                data: {
                    name: dept.name,
                    departmentType: dept.type,
                    description: `${dept.name} department`,
                    isActive: true,
                },
            })
            departmentId = department.id
            console.log(`  ✅ Department: ${dept.name}`)
        }

        // Create categories for this department
        for (const catName of dept.categories) {
            const existingCat = await prisma.complaintCategory.findFirst({
                where: { name: catName, departmentId },
            })

            if (!existingCat) {
                await prisma.complaintCategory.create({
                    data: {
                        name: catName,
                        departmentId,
                    },
                })
                console.log(`    ✅ Category: ${catName}`)
            } else {
                console.log(`    ↳ Category exists: ${catName}`)
            }
        }
    }

    console.log('\n🎉 Seed completed successfully!')
    console.log('\n📋 Login credentials (all passwords: password123):')
    console.log('  Admin:   admin@gov.in')
    console.log('  Citizen: citizen@example.com')
    console.log('  Officers: officer.<wardname>@gov.in')
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
