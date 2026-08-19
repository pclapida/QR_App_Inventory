const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const item = await prisma.item.findFirst({
    where: {
      OR: [
        { sku: { contains: 'ASDASDAS', mode: 'insensitive' } },
        { serialNumber: { contains: 'PF-5JXENW', mode: 'insensitive' } }
      ]
    }
  });
  console.log('Item in DB:', JSON.stringify(item, null, 2));

  const responsivas = await prisma.responsivaHistory.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Recent responsivas:', responsivas);
}

main().catch(console.error).finally(() => prisma.$disconnect());
