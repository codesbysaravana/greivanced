
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findUnique({
        where: {
            email: 'c.saravanapriyan3@gmail.com',
        },
    })

    if (user) {
        console.log('User exists:', user.id, user.email, user.role)
    } else {
        console.log('User not found.')
    }
}

main()
    .catch((e) => {
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
