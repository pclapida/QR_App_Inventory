const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isDeviceRequiringChecklist = (item) => {
  if (!item) return false;
  const cat = (item.category || '').toLowerCase().trim();
  const name = (item.name || '').toLowerCase().trim();
  const model = (item.model || '').toLowerCase().trim();
  const combined = `${cat} ${name} ${model}`;

  // 1. Descarte inmediato de accesorios, consumibles y periféricos que jamás llevan checklist
  if (
    cat === 'accesorios usb' ||
    cat === 'consumibles' ||
    cat === 'herramientas' ||
    cat === 'refacciones it' ||
    cat === 'periféricos' ||
    cat === 'perifericos' ||
    cat.includes('impresora') ||
    cat.includes('monitor') ||
    cat.includes('scanner')
  ) {
    return false;
  }

  // Si el nombre o modelo indica que es un accesorio o periférico
  const isPeripheralOrAccessory = /\b(usb|pendrive|flash drive|memoria|mouse|raton|ratón|teclado|keyboard|monitor|impresora|printer|zebra|scanner|escaner|escáner|lector|cable|adaptador|cargador|charger|diadema|headset|auricular)\b/i.test(
    `${name} ${model}`
  );

  if (isPeripheralOrAccessory) {
    const isExplicitComputer = /\b(laptop|notebook|thinkpad|macbook|latitude|elitebook|tablet|ipad|minipc|mini[- ]pc|desktop|optiplex|thinkcentre|workstation|panel industrial)\b/i.test(
      name
    );
    if (!isExplicitComputer) {
      return false;
    }
  }

  // 2. Comprobación estricta de categorías permitidas
  if (
    cat === 'laptops' ||
    cat === 'laptops & cómputo' ||
    cat === 'laptops & computo' ||
    cat === 'tablets' ||
    cat === 'paneles' ||
    cat === 'mini pcs & desktops'
  ) {
    return true;
  }

  // 3. Verificación de palabras clave
  return /\b(laptop|notebook|thinkpad|macbook|latitude|elitebook|pc|desktop|computadora|minipc|mini[- ]pc|optiplex|thinkcentre|workstation|tablet|ipad|galaxy tab|panel|paneles)\b/i.test(
    combined
  );
};

async function main() {
  const items = await prisma.item.findMany();
  console.log(`Total items: ${items.length}`);
  
  const checklistItems = items.filter(i => isDeviceRequiringChecklist(i));
  const nonChecklistItems = items.filter(i => !isDeviceRequiringChecklist(i));

  console.log(`\n=== REQUIEREN CHECKLIST (${checklistItems.length}) ===`);
  checklistItems.slice(0, 15).forEach(i => console.log(`[${i.sku}] "${i.name}" (Cat: "${i.category}", Model: "${i.model}")`));

  console.log(`\n=== NO REQUIEREN CHECKLIST (${nonChecklistItems.length}) ===`);
  nonChecklistItems.slice(0, 15).forEach(i => console.log(`[${i.sku}] "${i.name}" (Cat: "${i.category}", Model: "${i.model}")`));
}

main().finally(() => prisma.$disconnect());
