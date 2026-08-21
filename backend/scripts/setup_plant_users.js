const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Superadmin (pclapida) - Global (null plant)
  await prisma.user.upsert({
    where: { username: 'pclapida' },
    update: {
      role: 'SUPERADMIN',
      plant: null
    },
    create: {
      username: 'pclapida',
      name: 'pclapida',
      email: 'pclapida@coficab.com',
      password: defaultPasswordHash,
      role: 'SUPERADMIN',
      plant: null
    }
  });

  // 2. Planta 2 Admin (gustavo)
  await prisma.user.upsert({
    where: { username: 'gustavo' },
    update: {
      role: 'ADMIN_PLANTA',
      plant: 'Planta 2'
    },
    create: {
      username: 'gustavo',
      name: 'Gustavo Madera',
      email: 'gustavo@inventory.com',
      password: defaultPasswordHash,
      role: 'ADMIN_PLANTA',
      plant: 'Planta 2'
    }
  });

  // 3. Planta 2 (tester)
  await prisma.user.upsert({
    where: { username: 'tester' },
    update: {
      role: 'ADMIN_PLANTA',
      plant: 'Planta 2'
    },
    create: {
      username: 'tester',
      name: 'Usuario Pruebas',
      email: 'test@inventory.com',
      password: defaultPasswordHash,
      role: 'ADMIN_PLANTA',
      plant: 'Planta 2'
    }
  });

  // 4. Planta 2 (alejandro)
  await prisma.user.upsert({
    where: { username: 'alejandro' },
    update: {
      role: 'ADMIN_PLANTA',
      plant: 'Planta 2'
    },
    create: {
      username: 'alejandro',
      name: 'Alejandro',
      email: 'alejandro@inventory.com',
      password: defaultPasswordHash,
      role: 'ADMIN_PLANTA',
      plant: 'Planta 2'
    }
  });

  // 5. Planta 1 Profile (admin_planta1)
  await prisma.user.upsert({
    where: { username: 'admin_planta1' },
    update: {
      role: 'ADMIN_PLANTA',
      plant: 'Planta 1'
    },
    create: {
      username: 'admin_planta1',
      name: 'Administrador Planta 1',
      email: 'admin_planta1@coficab.com',
      password: defaultPasswordHash,
      role: 'ADMIN_PLANTA',
      plant: 'Planta 1'
    }
  });

  // 6. Planta 3 Profile (admin_planta3)
  await prisma.user.upsert({
    where: { username: 'admin_planta3' },
    update: {
      role: 'ADMIN_PLANTA',
      plant: 'Planta 3'
    },
    create: {
      username: 'admin_planta3',
      name: 'Administrador Planta 3',
      email: 'admin_planta3@coficab.com',
      password: defaultPasswordHash,
      role: 'ADMIN_PLANTA',
      plant: 'Planta 3'
    }
  });

  // 7. Planta UPCAST Profile (admin_upcast)
  await prisma.user.upsert({
    where: { username: 'admin_upcast' },
    update: {
      role: 'ADMIN_PLANTA',
      plant: 'Planta UPCAST'
    },
    create: {
      username: 'admin_upcast',
      name: 'Administrador Planta UPCAST',
      email: 'admin_upcast@coficab.com',
      password: defaultPasswordHash,
      role: 'ADMIN_PLANTA',
      plant: 'Planta UPCAST'
    }
  });

  const allUsers = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, plant: true }
  });

  console.log('All Users Configured in DB:');
  console.log(JSON.stringify(allUsers, null, 2));
}

main().finally(() => prisma.$disconnect());
