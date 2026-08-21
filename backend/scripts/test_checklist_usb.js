const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// The current function in api.ts
const isDeviceRequiringChecklistOld = (item) => {
  if (!item) return false;
  const cat = (item.category || '').toLowerCase().trim();
  const name = (item.name || '').toLowerCase().trim();
  const model = (item.model || '').toLowerCase().trim();
  const combined = `${cat} ${name} ${model}`;

  if (
    cat === 'laptops' ||
    cat === 'tablets' ||
    cat === 'paneles' ||
    cat.includes('panel') ||
    cat.includes('mini pc') ||
    cat.includes('desktop')
  ) {
    return true;
  }

  return (
    combined.includes('laptop') ||
    combined.includes('notebook') ||
    combined.includes('tablet') ||
    combined.includes('ipad') ||
    combined.includes('panel') ||
    combined.includes('paneles') ||
    combined.includes('minipc') ||
    combined.includes('mini pc') ||
    combined.includes('mini-pc') ||
    combined.includes('pc ') ||
    combined.startsWith('pc') ||
    combined.includes('computadora') ||
    combined.includes('desktop')
  );
};

async function main() {
  const items = await prisma.item.findMany();
  const usbItems = items.filter(i => (i.name + ' ' + (i.category||'') + ' ' + (i.model || '')).toLowerCase().includes('usb'));
  
  console.log('Testing old checklist function on USB items:');
  for (const item of usbItems) {
    const requires = isDeviceRequiringChecklistOld(item);
    console.log(`[${item.sku}] "${item.name}" (Cat: "${item.category}", Model: "${item.model}") => Requires checklist: ${requires}`);
  }
}

main().finally(() => prisma.$disconnect());
