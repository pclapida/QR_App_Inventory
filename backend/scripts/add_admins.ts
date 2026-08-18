import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addAdmins() {
  const passwordGustavo = await bcrypt.hash('gustavo123', 10);
  const passwordAlejandro = await bcrypt.hash('alejandro123', 10);

  const userGustavo = await prisma.user.upsert({
    where: { email: 'gustavo@inventory.com' },
    update: {
      name: 'Gustavo',
      username: 'gustavo',
      password: passwordGustavo,
      role: 'ADMIN'
    },
    create: {
      name: 'Gustavo',
      username: 'gustavo',
      email: 'gustavo@inventory.com',
      password: passwordGustavo,
      role: 'ADMIN'
    }
  });

  const userAlejandro = await prisma.user.upsert({
    where: { email: 'alejandro@inventory.com' },
    update: {
      name: 'Alejandro',
      username: 'alejandro',
      password: passwordAlejandro,
      role: 'ADMIN'
    },
    create: {
      name: 'Alejandro',
      username: 'alejandro',
      email: 'alejandro@inventory.com',
      password: passwordAlejandro,
      role: 'ADMIN'
    }
  });

  console.log('✅ Usuarios ADMIN creados con éxito:');
  console.log('1. Gustavo:', userGustavo.email, 'Username:', userGustavo.username, 'Role:', userGustavo.role);
  console.log('2. Alejandro:', userAlejandro.email, 'Username:', userAlejandro.username, 'Role:', userAlejandro.role);
}

addAdmins()
  .catch((e) => {
    console.error('Error creating admins:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
