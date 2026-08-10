import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// POST /api/items/:id/transactions - Register stock inbound or outbound with assignedTo (who took it)
router.post('/:id/transactions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, quantity, notes, assignedTo } = req.body;

    if (!type || (type !== 'INBOUND' && type !== 'OUTBOUND')) {
      return res.status(400).json({ error: 'Tipo de transacción inválido. Debe ser INBOUND o OUTBOUND' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor a cero' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const userId = req.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id } });

      if (!item) {
        throw new Error('NOT_FOUND: Artículo no encontrado');
      }

      let newStock = item.stock;
      if (type === 'INBOUND') {
        newStock += qty;
      } else {
        if (item.stock < qty) {
          throw new Error(`INSUFFICIENT_STOCK: Stock insuficiente. Stock actual: ${item.stock}`);
        }
        newStock -= qty;
      }

      const updatedItem = await tx.item.update({
        where: { id },
        data: { stock: newStock }
      });

      const transaction = await tx.transaction.create({
        data: {
          itemId: id,
          userId: userId,
          type: type,
          quantity: qty,
          assignedTo: assignedTo ? assignedTo.trim() : null,
          notes: notes ? notes.trim() : null
        },
        include: {
          user: { select: { id: true, name: true, username: true } }
        }
      });

      return { item: updatedItem, transaction };
    });

    return res.status(201).json({
      message: `Transacción de ${type === 'INBOUND' ? 'Entrada' : 'Salida'} registrada con éxito`,
      item: result.item,
      transaction: result.transaction
    });
  } catch (error: any) {
    console.error('Error al registrar transacción:', error);
    if (error.message && error.message.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    if (error.message && error.message.startsWith('INSUFFICIENT_STOCK:')) {
      return res.status(400).json({ error: error.message.replace('INSUFFICIENT_STOCK: ', '') });
    }
    return res.status(500).json({ error: 'Error al registrar la transacción de inventario' });
  }
});

// GET /api/items/:id/transactions
router.get('/:id/transactions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transactions = await prisma.transaction.findMany({
      where: { itemId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, username: true } }
      }
    });

    return res.json({ transactions });
  } catch (error: any) {
    console.error('Error al consultar transacciones:', error);
    return res.status(500).json({ error: 'Error al consultar historial de transacciones' });
  }
});

export default router;
