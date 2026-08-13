import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// GET /api/purchase-orders - List all purchase orders
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ orders });
  } catch (error: any) {
    console.error('Error al listar órdenes de compra:', error);
    return res.status(500).json({ error: 'Error interno al consultar órdenes de compra' });
  }
});

// POST /api/purchase-orders - Create new purchase order
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplier, itemName, category, quantity, unitPrice, notes } = req.body;

    if (!supplier || !itemName || !quantity) {
      return res.status(400).json({ error: 'Proveedor, Nombre de artículo y Cantidad son obligatorios.' });
    }

    const qty = parseInt(quantity, 10);
    const price = unitPrice ? parseFloat(unitPrice) : 0;
    const total = qty * price;
    const year = new Date().getFullYear();
    const randomPart = uuidv4().split('-')[0].toUpperCase();
    const poNumber = `PO-${year}-${randomPart}`;

    const order = await prisma.purchaseOrder.create({
      data: {
        id: uuidv4(),
        poNumber,
        supplier: supplier.trim(),
        itemName: itemName.trim(),
        category: category || 'Equipos & Dispositivos',
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
        status: 'PENDING',
        notes: notes ? notes.trim() : null
      }
    });

    return res.status(201).json({ order });
  } catch (error: any) {
    console.error('Error al crear orden de compra:', error);
    return res.status(500).json({ error: 'Error al registrar la orden de compra' });
  }
});

// PUT /api/purchase-orders/:id/status - Update status (If status -> RECEIVED, auto-increase or add item)
router.put('/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Estado de orden de compra inválido.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({ where: { id } });
      if (!order) {
        throw new Error('NOT_FOUND: Orden de compra no encontrada');
      }

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: { status }
      });

      // If newly marked as RECEIVED, atomically increase stock or create item + log transaction
      if (status === 'RECEIVED' && order.status !== 'RECEIVED') {
        const existingItem = await tx.item.findFirst({
          where: { name: { equals: order.itemName } }
        }) || await tx.item.findFirst({
          where: { name: { contains: order.itemName } }
        });

        let targetItemId: string;

        if (existingItem) {
          targetItemId = existingItem.id;
          await tx.item.update({
            where: { id: existingItem.id },
            data: { stock: existingItem.stock + order.quantity }
          });
        } else {
          targetItemId = uuidv4();
          const sku = `PO-ITM-${Math.floor(1000 + Math.random() * 9000)}`;
          await tx.item.create({
            data: {
              id: targetItemId,
              sku,
              name: order.itemName,
              category: order.category || 'Equipos & Dispositivos',
              stock: order.quantity,
              minStock: 1,
              unit: 'unidad',
              location: 'Almacén Central',
              qrCodePayload: `INV-${targetItemId}`
            }
          });
        }

        // Register transaction audit trail
        if (req.user?.id) {
          await tx.transaction.create({
            data: {
              itemId: targetItemId,
              userId: req.user.id,
              type: 'INBOUND',
              quantity: order.quantity,
              notes: `Ingreso automático por Orden de Compra ${order.poNumber} (${order.supplier})`
            }
          });
        }
      }

      return updatedOrder;
    });

    return res.json({ order: result });
  } catch (error: any) {
    console.error('Error al actualizar estado de orden de compra:', error);
    if (error.message && error.message.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
    }
    return res.status(500).json({ error: 'Error al actualizar la orden de compra' });
  }
});

export default router;
