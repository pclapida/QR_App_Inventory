import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de base de datos...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'pclapida@inventory.com' },
    update: {
      username: 'pclapida',
      name: 'pclapida',
      password: hashedPassword,
      role: 'SUPERADMIN',
      plant: null
    },
    create: {
      email: 'pclapida@inventory.com',
      username: 'pclapida',
      name: 'pclapida',
      password: hashedPassword,
      role: 'SUPERADMIN',
      plant: null
    }
  });

  console.log('Usuario administrador creado/verificado:', admin.username);

  // Seed sample items if database is empty
  const itemCount = await prisma.item.count();
  if (itemCount === 0) {
    const item1Id = uuidv4();
    const item2Id = uuidv4();
    const item3Id = uuidv4();

    await prisma.item.createMany({
      data: [
        {
          id: item1Id,
          sku: 'HW-SCN-001',
          name: 'Lector Escáner Códigos QR Honeywell Xenon 1950g',
          description: 'Pistola lectora inalámbrica 2D con emulador de teclado USB',
          category: 'Hardware & Equipos',
          stock: 12,
          minStock: 3,
          unit: 'unidad',
          location: 'Estante A1',
          qrCodePayload: `INV-${item1Id}`
        },
        {
          id: item2Id,
          sku: 'ETQ-THERM-4X6',
          name: 'Rollos de Etiqueta Térmica Directa 4x6 (1000 etq)',
          description: 'Rollos adhesivos para impresión de código QR e identificación de producto',
          category: 'Consumibles',
          stock: 45,
          minStock: 10,
          unit: 'caja',
          location: 'Pasillo B3',
          qrCodePayload: `INV-${item2Id}`
        },
        {
          id: item3Id,
          sku: 'TAB-IPAD-10',
          name: 'Tablet Samsung Galaxy Tab A9+ 11" 64GB',
          description: 'Dispositivo móvil para escaneo de QR mediante cámara web en almacén',
          category: 'Electrónica',
          stock: 8,
          minStock: 2,
          unit: 'unidad',
          location: 'Oficina Central',
          qrCodePayload: `INV-${item3Id}`
        }
      ]
    });

    console.log('Artículos de muestra creados exitosamente');
  }

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
