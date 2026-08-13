const sqlite3 = require('sqlite3').verbose();
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function migrateData() {
  const dbPath = path.join(__dirname, 'prisma', 'dev.db');
  console.log(`Abriendo base de datos SQLite en: ${dbPath}`);
  
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Error abriendo dev.db:', err.message);
      process.exit(1);
    }
  });

  const query = (sql) => new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  try {
    console.log('\n--- Migrando Usuarios ---');
    const users = await query('SELECT * FROM User');
    for (const u of users) {
      // Check if exists
      const exists = await prisma.user.findUnique({ where: { email: u.email } });
      if (!exists) {
        await prisma.user.create({ data: { ...u, createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt) } });
        console.log(`✅ Usuario migrado: ${u.email}`);
      }
    }

    console.log('\n--- Migrando Artículos (Items) ---');
    const items = await query('SELECT * FROM Item');
    for (const item of items) {
      const exists = await prisma.item.findUnique({ where: { sku: item.sku } });
      if (!exists) {
        // Convert boolean fields
        item.hasWarranty = item.hasWarranty === 1;
        item.isITInternal = item.isITInternal === 1;
        await prisma.item.create({ data: { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) } });
        console.log(`✅ Artículo migrado: ${item.sku} - ${item.name}`);
      }
    }

    console.log('\n--- Migrando Historial de Responsivas ---');
    const responsivas = await query('SELECT * FROM ResponsivaHistory');
    for (const res of responsivas) {
      const exists = await prisma.responsivaHistory.findUnique({ where: { id: res.id } });
      if (!exists) {
        res.emailSent = res.emailSent === 1;
        await prisma.responsivaHistory.create({ data: { ...res, createdAt: new Date(res.createdAt) } });
        console.log(`✅ Responsiva migrada: ${res.colaborador}`);
      }
    }

    console.log('\n--- Migrando Transacciones ---');
    const transactions = await query('SELECT * FROM "Transaction"');
    for (const trx of transactions) {
      const exists = await prisma.transaction.findUnique({ where: { id: trx.id } });
      if (!exists) {
        await prisma.transaction.create({ data: { ...trx, createdAt: new Date(trx.createdAt) } });
        console.log(`✅ Transacción migrada de: ${trx.userId}`);
      }
    }

    console.log('\n--- Migrando Mantenimientos ---');
    const maintenances = await query('SELECT * FROM Maintenance');
    for (const main of maintenances) {
      const exists = await prisma.maintenance.findUnique({ where: { id: main.id } });
      if (!exists) {
        await prisma.maintenance.create({ data: { ...main, performedAt: new Date(main.performedAt), nextDueDate: new Date(main.nextDueDate), createdAt: new Date(main.createdAt) } });
        console.log(`✅ Mantenimiento migrado: ${main.id}`);
      }
    }

    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE! 🎉');

  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    db.close();
    await prisma.$disconnect();
  }
}

migrateData();
