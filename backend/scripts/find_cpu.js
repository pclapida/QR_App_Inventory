const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.item.findMany();
  const cpuItems = items.filter(i => {
    const text = (i.name + ' ' + (i.category||'') + ' ' + (i.model || '')).toLowerCase();
    return /\bcpu\b/i.test(text);
  });
  console.log(`Found ${cpuItems.length} CPU items in DB:`);
  cpuItems.forEach(i => console.log(`[${i.sku}] "${i.name}" (Cat: "${i.category}", Model: "${i.model}", Plant: "${i.plant}")`));
}

main().finally(() => prisma.$disconnect());
