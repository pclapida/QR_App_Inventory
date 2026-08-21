const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.item.findMany();
  const usbItems = items.filter(i => (i.name + ' ' + i.category + ' ' + (i.model || '')).toLowerCase().includes('usb'));
  console.log('Total USB items found:', usbItems.length);
  console.log(JSON.stringify(usbItems.map(i => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    category: i.category,
    model: i.model,
    plant: i.plant,
    isITInternal: i.isITInternal
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
