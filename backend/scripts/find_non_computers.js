const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.item.findMany();
  console.log(`Total items in DB: ${items.length}`);
  const nonComputers = items.filter(i => {
    const text = (i.name + ' ' + (i.category||'') + ' ' + (i.model || '')).toLowerCase();
    return text.includes('usb') || text.includes('adaptador') || text.includes('cable') || text.includes('mouse') || text.includes('teclado');
  });
  console.log(JSON.stringify(nonComputers.map(i => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    category: i.category,
    model: i.model,
    plant: i.plant
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
