import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { authenticateToken, requireAdmin, requireSuperAdmin, AuthenticatedRequest, ROLES } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// ── Helpers ──────────────────────────────────────────────────────────────────

const canManagePlant = (req: AuthenticatedRequest, plant: string): boolean => {
  if (!req.user) return false;
  if (req.user.role === ROLES.SUPERADMIN) return true;
  // ADMIN_PLANTA or legacy ADMIN can manage their own plant
  if ((req.user.role === ROLES.ADMIN_PLANTA || req.user.role === 'ADMIN') && req.user.plant === plant) return true;
  return false;
};

// ── GET /api/capex — list CAPEX codes (scoped by plant unless superadmin) ────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { plant, year } = req.query;
    const whereClause: any = {};

    // Non-superadmin: force their plant
    if (req.user && req.user.role !== ROLES.SUPERADMIN && req.user.plant) {
      whereClause.plant = req.user.plant;
    } else if (plant && typeof plant === 'string' && plant.trim() !== '') {
      whereClause.plant = plant.trim();
    }

    if (year && typeof year === 'string' && year.trim() !== '') {
      whereClause.year = parseInt(year.trim(), 10);
    }

    const codes = await prisma.capexCode.findMany({
      where: whereClause,
      orderBy: [{ year: 'desc' }, { code: 'asc' }],
      include: {
        _count: { select: { purchaseOrders: true } }
      }
    });

    // Compute availableEUR on the fly
    const result = codes.map(c => ({
      ...c,
      availableEUR: c.budgetEUR - c.consumedEUR,
      isNegative: (c.budgetEUR - c.consumedEUR) < 0
    }));

    return res.json({ codes: result });
  } catch (error: any) {
    console.error('Error al listar códigos CAPEX:', error);
    return res.status(500).json({ error: 'Error al consultar códigos CAPEX' });
  }
});

// ── POST /api/capex — create a new CAPEX code ─────────────────────────────────
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, description, year, plant, budgetEUR, quantity, priceEUR, notes } = req.body;

    if (!code || !description || !year || !plant || budgetEUR === undefined) {
      return res.status(400).json({ error: 'Código, Descripción, Año, Planta y Presupuesto EUR son obligatorios.' });
    }

    if (!canManagePlant(req, plant)) {
      return res.status(403).json({ error: 'No tienes permisos para crear códigos CAPEX en esta planta.' });
    }

    const existing = await prisma.capexCode.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return res.status(409).json({ error: `Ya existe un código CAPEX con el folio "${code}".` });
    }

    const created = await prisma.capexCode.create({
      data: {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        year: parseInt(year, 10),
        plant: plant.trim(),
        budgetEUR: parseFloat(budgetEUR),
        consumedEUR: 0,
        quantity: quantity ? parseInt(quantity, 10) : null,
        priceEUR: priceEUR ? parseFloat(priceEUR) : null,
        notes: notes ? notes.trim() : null,
        isActive: true
      }
    });

    return res.status(201).json({ code: { ...created, availableEUR: created.budgetEUR - created.consumedEUR } });
  } catch (error: any) {
    console.error('Error al crear código CAPEX:', error);
    return res.status(500).json({ error: 'Error interno al crear código CAPEX' });
  }
});

// ── PUT /api/capex/:id — update a CAPEX code ─────────────────────────────────
router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.capexCode.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Código CAPEX no encontrado' });

    if (!canManagePlant(req, existing.plant)) {
      return res.status(403).json({ error: 'No tienes permisos para editar códigos CAPEX de esta planta.' });
    }

    const { description, year, budgetEUR, quantity, priceEUR, notes, isActive } = req.body;

    const updated = await prisma.capexCode.update({
      where: { id },
      data: {
        description: description !== undefined ? description.trim() : existing.description,
        year: year !== undefined ? parseInt(year, 10) : existing.year,
        budgetEUR: budgetEUR !== undefined ? parseFloat(budgetEUR) : existing.budgetEUR,
        quantity: quantity !== undefined ? parseInt(quantity, 10) : existing.quantity,
        priceEUR: priceEUR !== undefined ? parseFloat(priceEUR) : existing.priceEUR,
        notes: notes !== undefined ? notes.trim() : existing.notes,
        isActive: isActive !== undefined ? isActive : existing.isActive
      }
    });

    return res.json({ code: { ...updated, availableEUR: updated.budgetEUR - updated.consumedEUR } });
  } catch (error: any) {
    console.error('Error al actualizar código CAPEX:', error);
    return res.status(500).json({ error: 'Error interno al actualizar código CAPEX' });
  }
});

// ── DELETE /api/capex/:id — delete a CAPEX code (only if no requisitions used it) ──
router.delete('/:id', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.capexCode.findUnique({
      where: { id },
      include: { _count: { select: { purchaseOrders: true } } }
    });
    if (!existing) return res.status(404).json({ error: 'Código CAPEX no encontrado' });

    if (existing._count.purchaseOrders > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: este código tiene ${existing._count.purchaseOrders} requisicion(es) asociada(s). Desactívalo en su lugar.`
      });
    }

    await prisma.capexCode.delete({ where: { id } });
    return res.json({ message: 'Código CAPEX eliminado correctamente.' });
  } catch (error: any) {
    console.error('Error al eliminar código CAPEX:', error);
    return res.status(500).json({ error: 'Error interno al eliminar código CAPEX' });
  }
});

export default router;
