import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allItems = await prisma.item.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      category: true,
      area: true,
      assignedTo: true,
      plant: true,
      isITInternal: true,
      stock: true
    }
  });

  console.log('Total items in DB:', allItems.length);
  allItems.forEach(i => {
    console.log(`- [${i.sku}] ${i.name} | Cat: ${i.category} | Area: "${i.area}" | Assigned: "${i.assignedTo}" | isITInternal: ${i.isITInternal} | Plant: ${i.plant}`);
  });

  // Find all items where area or assignedTo is IT / Sistemas / Taller IT
  const itItems = allItems.filter(i => {
    const a = (i.area || '').toLowerCase().trim();
    const as = (i.assignedTo || '').toLowerCase().trim();
    return a === 'it' || a === 'sistemas' || a === 'taller it' || a === 'taller interno it' ||
           as === 'it' || as === 'sistemas' || as === 'taller it' || as === 'taller interno it' ||
           i.name.toLowerCase().includes('it internal') || (i.sku && i.sku.startsWith('IT-'));
  });

  console.log(`\nFound ${itItems.length} items to update to isITInternal = true:`);
  for (const it of itItems) {
    console.log(`Updating ${it.sku} (${it.name})...`);
    await prisma.item.update({
      where: { id: it.id },
      data: {
        isITInternal: true
      }
    });
  }

  console.log('Migration completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
