import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // 1. Create Admin
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@gov.in' },
        update: {},
        create: {
            email: 'admin@gov.in',
            passwordHash: adminPassword,
            role: Role.ADMIN,
            isActive: true,
            // Create profile if needed, but for now basic user
        },
    })
    console.log(`Created Admin: ${admin.email}`)

    // 2. Create Districts & Wards (using Wards table)
    const districts = ['Central', 'North', 'South', 'East', 'West']

    for (const district of districts) {
        for (let i = 1; i <= 2; i++) {
            const wardName = `${district}-Ward-${i}`
            // Note: PostGIS geometry is hard to seed via Prisma directly without raw query.
            // We use createUnchecked or just omit geometry for now if optional (it is optional in schema? No, created via sql)
            // But wkt_geometry is string? Schema says: geospatial fields are usually unsupported in Prisma seed without extensions?
            // Schema has: geo_boundary: Unsupported("geometry(MultiPolygon, 4326)")?
            // Actually the schema I saw earlier had `geo_boundary` as Unsupported.
            // So we can't seed it easily. We will skip creating wards here or limit to just name if possible.
            // But Ward model has name, districtName.
            // Let's assume we can create basic ward record.

            // Check if ward exists
            const existingWard = await prisma.ward.findFirst({ where: { name: wardName } })

            let wardId = existingWard?.id

            if (!existingWard) {
                // We might fail if boundary is required.
                // But let's try assuming db has defaults or constraints allow null? 
                // Schema likely requires it.
                // Use executeRaw to insert if needed.
                // For now, let's just seed Users/Officers and assume Wards exist or skip officer creation if specific ward logic is complex.
                // But we need wards for officers.
                // Let's try creating a dummy ward using raw sql if prisma fails.

                try {
                    // Try raw insert for PostGIS
                    // formatting polygon: POLYGON((...))
                    const wkt = "SRID=4326;MULTIPOLYGON(((77.1 28.5, 77.2 28.5, 77.2 28.6, 77.1 28.6, 77.1 28.5)))" // Dummy square
                    const result = await prisma.$queryRaw`
                        INSERT INTO wards (name, district_name, geo_boundary)
                        VALUES (${wardName}, ${district}, ST_GeomFromText(${wkt}))
                        RETURNING id
                     `
                    // result is array
                    if (Array.isArray(result) && result.length > 0) {
                        wardId = result[0].id
                    }
                } catch (e) {
                    console.error(`Failed to create ward ${wardName}:`, e)
                }
            }

            if (wardId) {
                // 3. Create Officer
                const officerEmail = `officer.${wardName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gov.in`
                const officerPassword = await bcrypt.hash('officer123', 10)

                const officerUser = await prisma.user.upsert({
                    where: { email: officerEmail },
                    update: {},
                    create: {
                        email: officerEmail,
                        passwordHash: officerPassword,
                        role: Role.OFFICER,
                        isActive: true,
                        officerProfile: {
                            create: {
                                wardId: wardId,
                                designation: 'Ward Officer'
                            }
                        },
                        citizenProfile: {
                            create: {
                                fullName: `Officer ${wardName}`
                            }
                        }
                    }
                })
                console.log(`Created Officer: ${officerUser.email}`)
            }
        }
    }

    console.log('✅ Seed completed')
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
