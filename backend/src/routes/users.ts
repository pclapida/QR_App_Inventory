import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { authenticateToken, requireAdmin, requireSuperAdmin, AuthenticatedRequest, PLANTS, ROLES } from '../middleware/auth';

const router = Router();

// All user management routes require authentication & ADMIN role or higher
router.use(authenticateToken);
router.use(requireAdmin);

const VALID_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN_PLANTA, ROLES.OPERATOR, ROLES.AUDITOR, ROLES.USER];

// GET /api/users - List all registered users
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        plant: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { transactions: true }
        }
      }
    });

    return res.json({ users });
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ error: 'Error al consultar la lista de usuarios' });
  }
});

// POST /api/users - Create a new user
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, name, email, password, role, plant } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'El nombre, nombre de usuario y contraseña son obligatorios' });
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    if (!isSuperAdmin) {
      if (role === ROLES.SUPERADMIN) {
        return res.status(403).json({ error: 'No tienes permisos para crear un SUPERADMIN' });
      }
      if (plant !== req.user?.plant) {
        return res.status(403).json({ error: 'Solo puedes crear usuarios para tu propia planta' });
      }
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email ? email.trim().toLowerCase() : `${cleanUsername}@coficab.com`;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese nombre de usuario o correo electrónico' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = VALID_ROLES.includes(role) ? role : ROLES.USER;
    // SUPERADMIN has no plant restriction; everyone else must have a plant
    const userPlant = userRole === ROLES.SUPERADMIN ? null : (PLANTS.includes(plant) ? plant : null);

    if (userRole !== ROLES.SUPERADMIN && !userPlant) {
      return res.status(400).json({ error: 'Debes asignar una planta válida para este rol. Plantas válidas: Planta 1, Planta 2, Planta 3, Planta UPCAST' });
    }

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        name: name.trim(),
        password: hashedPassword,
        role: userRole,
        plant: userPlant
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        plant: true,
        createdAt: true
      }
    });

    return res.status(201).json({ user: newUser, message: 'Usuario creado exitosamente' });
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ error: 'Error al crear el usuario en el sistema' });
  }
});

// PUT /api/users/:id - Update user details, role or password
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, plant, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    if (!isSuperAdmin) {
      if (existing.plant !== req.user?.plant) {
        return res.status(403).json({ error: 'No tienes permisos para editar usuarios de otras plantas' });
      }
      if (role === ROLES.SUPERADMIN) {
        return res.status(403).json({ error: 'No tienes permisos para asignar el rol de SUPERADMIN' });
      }
      if (plant !== undefined && plant !== req.user?.plant) {
        return res.status(403).json({ error: 'No puedes mover usuarios a otras plantas' });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (role !== undefined && VALID_ROLES.includes(role)) {
      updateData.role = role;
    }
    // Update plant: SUPERADMIN gets null, others need a valid plant
    if (plant !== undefined) {
      const newRole = updateData.role || existing.role;
      if (newRole === ROLES.SUPERADMIN) {
        updateData.plant = null;
      } else if (PLANTS.includes(plant)) {
        updateData.plant = plant;
      }
    }

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        plant: true,
        updatedAt: true
      }
    });

    return res.json({ user: updatedUser, message: 'Usuario actualizado correctamente' });
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ error: 'Error al actualizar la información del usuario' });
  }
});

// DELETE /api/users/:id - Delete a user
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({ error: 'No puede eliminar su propia cuenta de administrador activa' });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    if (!isSuperAdmin) {
      if (existing.role === ROLES.SUPERADMIN) {
        return res.status(403).json({ error: 'No tienes permisos para eliminar a un SUPERADMIN' });
      }
      if (existing.plant !== req.user?.plant) {
        return res.status(403).json({ error: 'No puedes eliminar usuarios de otras plantas' });
      }
    }

    await prisma.user.delete({ where: { id } });

    return res.json({ message: 'Usuario eliminado del sistema exitosamente' });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

// ─── GET /api/users/backup/download — Descarga de respaldo completo 1-Clic ──
router.get('/backup/download', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      users,
      items,
      transactions,
      maintenances,
      purchaseOrders,
      responsivas,
      loans
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.item.findMany(),
      prisma.transaction.findMany(),
      prisma.maintenance.findMany(),
      prisma.purchaseOrder.findMany(),
      prisma.responsivaHistory.findMany(),
      prisma.deviceLoan.findMany()
    ]);

    const backupData = {
      metadata: {
        title: 'COFICAB Inventory System - Base de Datos Backup',
        exportedAt: new Date().toISOString(),
        exportedBy: req.user?.name || req.user?.username || 'Admin',
        engine: 'PostgreSQL',
        version: '2.0.0',
        totalTables: 7,
        recordCounts: {
          users: users.length,
          items: items.length,
          transactions: transactions.length,
          maintenances: maintenances.length,
          purchaseOrders: purchaseOrders.length,
          responsivas: responsivas.length,
          deviceLoans: loans.length,
          totalRecords: users.length + items.length + transactions.length + maintenances.length + purchaseOrders.length + responsivas.length + loans.length
        }
      },
      data: {
        users,
        items,
        transactions,
        maintenances,
        purchaseOrders,
        responsivas,
        deviceLoans: loans
      }
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="COFICAB_QR_Inventory_Backup_${dateStr}.json"`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (error: any) {
    console.error('Error generating database backup:', error);
    return res.status(500).json({ error: 'Error al generar el respaldo de la base de datos' });
  }
});

// ─── GET /api/users/stats/summary — Estadísticas globales del sistema ───────
router.get('/stats/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      usersCount,
      itemsCount,
      transactionsCount,
      maintenancesCount,
      purchaseOrdersCount,
      responsivasCount,
      loansCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.transaction.count(),
      prisma.maintenance.count(),
      prisma.purchaseOrder.count(),
      prisma.responsivaHistory.count(),
      prisma.deviceLoan.count()
    ]);

    return res.json({
      stats: {
        users: usersCount,
        items: itemsCount,
        transactions: transactionsCount,
        maintenances: maintenancesCount,
        purchaseOrders: purchaseOrdersCount,
        responsivas: responsivasCount,
        deviceLoans: loansCount,
        totalRecords: usersCount + itemsCount + transactionsCount + maintenancesCount + purchaseOrdersCount + responsivasCount + loansCount
      }
    });
  } catch (error: any) {
    console.error('Error fetching database stats:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas del sistema' });
  }
});

export default router;
