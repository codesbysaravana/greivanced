
const { PrismaClient } = require('@prisma/client')
const { PrismaNeon } = require('@prisma/adapter-neon')
const { Pool, neonConfig } = require('@neondatabase/serverless')
const ws = require('ws')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

// Manually load .env
try {
    const envPath = path.resolve(__dirname, '.env')
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
        const [key, ...values] = line.split('=')
        if (key && values.length > 0) {
            process.env[key.trim()] = values.join('=').trim()
        }
    })
} catch (e) {
    console.error('Failed to load .env', e)
}

neonConfig.webSocketConstructor = ws

const connectionString = process.env.DATABASE_URL
console.log('DB URL Length:', connectionString ? connectionString.length : 0)
if (connectionString) {
    console.log('DB URL Start:', connectionString.substring(0, 15) + '...')
}

if (!connectionString) {
    console.error('DATABASE_URL is missing')
    process.exit(1)
}

// Try simpler config
const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const email = 'c.saravanapriyan3@gmail.com'
    const password = 'password'

    // Test connection
    console.log('Testing connection...')

    // Query without check first to fail fast
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const existing = await prisma.user.findUnique({
            where: { email }
        })

        if (existing) {
            console.log(`User ${email} already exists. Updating password...`)
            await prisma.user.update({
                where: { email },
                data: { passwordHash: hashedPassword }
            })
            console.log('Password updated to "password"')
        } else {
            console.log(`Creating user ${email}...`)
            const user = await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    role: 'CITIZEN',
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
    } catch (err) {
        console.error('Prisma Error:', err)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
