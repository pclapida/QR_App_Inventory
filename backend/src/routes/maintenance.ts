import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// GET /api/maintenance - List all maintenance records
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const maintenances = await prisma.maintenance.findMany({
      orderBy: { performedAt: 'desc' },
      include: {
        item: {
          select: { id: true, name: true, sku: true, model: true, serialNumber: true, area: true, category: true }
        }
      }
    });

    return res.json({ maintenances });
  } catch (error: any) {
    console.error('Error al listar mantenimientos:', error);
    return res.status(500).json({ error: 'Error interno al consultar mantenimientos' });
  }
});

// POST /api/maintenance - Create new maintenance record
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId, deviceType, performedBy, checklist, notes, frequencyDays } = req.body;

    if (!itemId || !performedBy) {
      return res.status(400).json({ error: 'El equipo y la persona que realizó el mantenimiento son obligatorios.' });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const days = parseInt(frequencyDays || '30', 10);
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + days);

    const checklistStr = Array.isArray(checklist) ? checklist.join(', ') : String(checklist || 'Mantenimiento General');

    const maintenance = await prisma.maintenance.create({
      data: {
        id: uuidv4(),
        itemId,
        deviceType: deviceType || item.category || 'General',
        performedBy: performedBy.trim(),
        checklist: checklistStr,
        notes: notes ? notes.trim() : null,
        performedAt: new Date(),
        nextDueDate: nextDueDate
      },
      include: {
        item: {
          select: { id: true, name: true, sku: true, model: true, serialNumber: true, area: true }
        }
      }
    });

    return res.status(201).json({ maintenance });
  } catch (error: any) {
    console.error('Error al registrar mantenimiento:', error);
    return res.status(500).json({ error: 'Error al guardar el registro de mantenimiento' });
  }
});

export default router;
