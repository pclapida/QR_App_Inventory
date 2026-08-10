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

    const order = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: { status }
    });

    // If marked as RECEIVED, auto-add or update stock in Inventory!
    if (status === 'RECEIVED' && order.status !== 'RECEIVED') {
      // Find matching item by name or create a new one
      const existingItem = await prisma.item.findFirst({
        where: { name: { contains: order.itemName } }
      });

      if (existingItem) {
        await prisma.item.update({
          where: { id: existingItem.id },
          data: { stock: existingItem.stock + order.quantity }
        });
      } else {
        const newItemId = uuidv4();
        const sku = `PO-ITM-${Math.floor(1000 + Math.random() * 9000)}`;
        await prisma.item.create({
          data: {
            id: newItemId,
            sku,
            name: order.itemName,
            category: order.category || 'Equipos & Dispositivos',
            stock: order.quantity,
            minStock: 1,
            unit: 'unidad',
            location: 'Almacén Central',
            qrCodePayload: `INV-${newItemId}`
          }
        });
      }
    }

    return res.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Error al actualizar estado de orden de compra:', error);
    return res.status(500).json({ error: 'Error al actualizar la orden de compra' });
  }
});

export default router;
