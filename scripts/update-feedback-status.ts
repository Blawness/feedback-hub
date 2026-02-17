import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating existing IN_PROGRESS status to ASSIGNED...');

    const result = await prisma.feedback.updateMany({
        where: { status: 'IN_PROGRESS' },
        data: { status: 'ASSIGNED' }
    });

    console.log(`Updated ${result.count} feedback records`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
