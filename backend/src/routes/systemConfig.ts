import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, requireSuperAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

const DEFAULT_CONFIG = {
  EUR_RATE: '21.50',
  USD_RATE: '19.50'
};

// ── GET /api/system-config — get all config values (EUR_RATE, USD_RATE) ──────
router.get('/', async (_req, res: Response) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    const result: Record<string, { value: string; updatedAt: Date | null; updatedBy: string | null }> = {};

    // Build defaults first
    for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
      result[key] = { value, updatedAt: null, updatedBy: null };
    }

    // Override with DB values
    for (const cfg of configs) {
      result[cfg.key] = { value: cfg.value, updatedAt: cfg.updatedAt, updatedBy: cfg.updatedBy || null };
    }

    return res.json({ config: result });
  } catch (error: any) {
    console.error('Error al obtener configuración del sistema:', error);
    return res.status(500).json({ error: 'Error interno al obtener configuración' });
  }
});

// ── PUT /api/system-config/:key — update a config value (SUPERADMIN only) ────
router.put('/:key', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const VALID_KEYS = ['EUR_RATE', 'USD_RATE'];
    if (!VALID_KEYS.includes(key)) {
      return res.status(400).json({ error: `Clave de configuración inválida. Valores permitidos: ${VALID_KEYS.join(', ')}` });
    }

    if (!value || isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
      return res.status(400).json({ error: 'El valor debe ser un número mayor a 0.' });
    }

    const updated = await prisma.systemConfig.upsert({
      where: { key },
      update: { value: String(parseFloat(value).toFixed(4)), updatedBy: req.user?.username || req.user?.id || 'system' },
      create: { key, value: String(parseFloat(value).toFixed(4)), updatedBy: req.user?.username || req.user?.id || 'system' }
    });

    return res.json({ config: updated, message: `Tipo de cambio ${key} actualizado a ${updated.value}` });
  } catch (error: any) {
    console.error('Error al actualizar configuración del sistema:', error);
    return res.status(500).json({ error: 'Error interno al actualizar configuración' });
  }
});

export default router;
