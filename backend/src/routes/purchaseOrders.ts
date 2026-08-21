import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// GET /api/purchase-orders - List all requisitions / purchase orders with search and filters
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, status, supplier } = req.query;
    const whereClause: any = {};

    if (status && typeof status === 'string' && status.trim() !== '') {
      whereClause.status = status.trim();
    }

    if (supplier && typeof supplier === 'string' && supplier.trim() !== '') {
      whereClause.supplier = { contains: supplier.trim(), mode: 'insensitive' };
    }

    if (q && typeof q === 'string' && q.trim() !== '') {
      const query = q.trim();
      whereClause.OR = [
        { itemName: { contains: query, mode: 'insensitive' } },
        { reqNumber: { contains: query, mode: 'insensitive' } },
        { poNumber: { contains: query, mode: 'insensitive' } },
        { requisitionFor: { contains: query, mode: 'insensitive' } },
        { supplier: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } }
      ];
    }

    const orders = await prisma.purchaseOrder.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ orders });
  } catch (error: any) {
    console.error('Error al listar requisiciones:', error);
    return res.status(500).json({ error: 'Error interno al consultar requisiciones' });
  }
});

// Helper: get the current EUR exchange rate from DB (falls back to 21.50)
async function getEurRate(): Promise<number> {
  try {
    const cfg = await prisma.systemConfig.findUnique({ where: { key: 'EUR_RATE' } });
    return cfg ? parseFloat(cfg.value) : 21.50;
  } catch { return 21.50; }
}

// POST /api/purchase-orders - Create new requisition
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      requisitionFor,
      reqNumber,
      itemName,
      category,
      purchaseType,
      capexCodeId,
      quantity,
      unitPrice,
      supplier,
      poNumber,
      notes
    } = req.body;

    if (!itemName || !quantity || !supplier) {
      return res.status(400).json({ error: 'Artículo, Cantidad y Proveedor son obligatorios.' });
    }

    const type = (purchaseType === 'CAPEX') ? 'CAPEX' : 'OPEX';

    // CAPEX requires a code
    if (type === 'CAPEX' && !capexCodeId) {
      return res.status(400).json({ error: 'Para requisiciones CAPEX, el Código de Inversión es obligatorio.' });
    }

    // Validate the CAPEX code exists
    if (type === 'CAPEX' && capexCodeId) {
      const capexCode = await prisma.capexCode.findUnique({ where: { id: capexCodeId } });
      if (!capexCode) return res.status(404).json({ error: 'Código CAPEX no encontrado.' });
      if (!capexCode.isActive) return res.status(400).json({ error: 'El código CAPEX seleccionado está inactivo.' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor a 0.' });
    }

    const price = unitPrice ? parseFloat(unitPrice) : 0;
    const total = qty * price;
    const year = new Date().getFullYear();
    const randomPart = uuidv4().split('-')[0].toUpperCase();
    const finalReqNumber = reqNumber && reqNumber.trim() ? reqNumber.trim() : `REQ-${year}-${randomPart}`;

    // Calculate EUR equivalent using configured rate
    const eurRate = await getEurRate();
    const amountEUR = eurRate > 0 ? parseFloat((total / eurRate).toFixed(4)) : null;

    const order = await prisma.purchaseOrder.create({
      data: {
        id: uuidv4(),
        reqNumber: finalReqNumber,
        requisitionFor: requisitionFor ? requisitionFor.trim() : null,
        poNumber: poNumber && poNumber.trim() ? poNumber.trim() : null,
        supplier: supplier.trim(),
        itemName: itemName.trim(),
        category: category || 'Equipos & Dispositivos',
        purchaseType: type,
        capexCodeId: type === 'CAPEX' ? capexCodeId : null,
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
        amountEUR,
        status: 'PENDING',
        notes: notes ? notes.trim() : null
      },
      include: { capexCode: true }
    });

    return res.status(201).json({ order });
  } catch (error: any) {
    console.error('Error al crear requisición:', error);
    return res.status(500).json({ error: 'Error al registrar la requisición' });
  }
});

// PUT /api/purchase-orders/:id - Full update of requisition (edit PO number, supplier, reception date, etc.)
router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      requisitionFor,
      reqNumber,
      itemName,
      category,
      quantity,
      unitPrice,
      supplier,
      poNumber,
      status,
      receivedDate,
      receivedBy,
      notes
    } = req.body;

    const existingOrder = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existingOrder) {
      return res.status(404).json({ error: 'Requisición no encontrada' });
    }

    const qty = quantity !== undefined ? parseInt(quantity, 10) : existingOrder.quantity;
    const price = unitPrice !== undefined ? parseFloat(unitPrice) : (existingOrder.unitPrice || 0);
    const total = qty * price;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.update({
        where: { id },
        data: {
          requisitionFor: requisitionFor !== undefined ? (requisitionFor ? requisitionFor.trim() : null) : existingOrder.requisitionFor,
          reqNumber: reqNumber !== undefined ? (reqNumber ? reqNumber.trim() : null) : existingOrder.reqNumber,
          poNumber: poNumber !== undefined ? (poNumber ? poNumber.trim() : null) : existingOrder.poNumber,
          supplier: supplier !== undefined ? supplier.trim() : existingOrder.supplier,
          itemName: itemName !== undefined ? itemName.trim() : existingOrder.itemName,
          category: category !== undefined ? category : existingOrder.category,
          quantity: qty,
          unitPrice: price,
          totalPrice: total,
          status: status || existingOrder.status,
          receivedDate: receivedDate ? new Date(receivedDate) : existingOrder.receivedDate,
          receivedBy: receivedBy !== undefined ? receivedBy : existingOrder.receivedBy,
          notes: notes !== undefined ? (notes ? notes.trim() : null) : existingOrder.notes
        }
      });

      // If status changed to RECEIVED from another status, auto-add stock + log audit trail
      if (status === 'RECEIVED' && existingOrder.status !== 'RECEIVED') {
        const itemRecord = await tx.item.findFirst({
          where: { name: { equals: order.itemName } }
        }) || await tx.item.findFirst({
          where: { name: { contains: order.itemName } }
        });

        let targetItemId: string;

        if (itemRecord) {
          targetItemId = itemRecord.id;
          await tx.item.update({
            where: { id: itemRecord.id },
            data: { stock: itemRecord.stock + order.quantity }
          });
        } else {
          targetItemId = uuidv4();
          const sku = `REQ-ITM-${Math.floor(1000 + Math.random() * 9000)}`;
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

        if (req.user?.id) {
          await tx.transaction.create({
            data: {
              itemId: targetItemId,
              userId: req.user.id,
              type: 'INBOUND',
              quantity: order.quantity,
              notes: `Ingreso automático por Requisición ${order.reqNumber || order.id} ${order.poNumber ? `(OC: ${order.poNumber})` : ''} - Proveedor: ${order.supplier}`
            }
          });
        }
      }

      return order;
    });

    return res.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Error al editar requisición:', error);
    return res.status(500).json({ error: 'Error al actualizar la requisición' });
  }
});

// PUT /api/purchase-orders/:id/status - Quick status update
router.put('/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, receivedDate, receivedBy } = req.body;

    if (!status || !['PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Estado de requisición inválido.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({ where: { id } });
      if (!order) {
        throw new Error('NOT_FOUND: Requisición no encontrada');
      }

      const isReceived = status === 'RECEIVED';
      const actualReceivedDate = isReceived ? (receivedDate ? new Date(receivedDate) : new Date()) : order.receivedDate;
      const actualReceivedBy = isReceived ? (receivedBy || req.user?.username || 'Admin') : order.receivedBy;

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status,
          receivedDate: actualReceivedDate,
          receivedBy: actualReceivedBy
        }
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
          const sku = `REQ-ITM-${Math.floor(1000 + Math.random() * 9000)}`;
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
              notes: `Ingreso automático por Requisición ${order.reqNumber || order.id} ${order.poNumber ? `(OC: ${order.poNumber})` : ''} - Proveedor: ${order.supplier}`
            }
          });
        }

        // ── CAPEX Budget Deduction ─────────────────────────────────────────────
        // If this requisition is CAPEX and has a linked code, deduct amountEUR from the code's consumedEUR
        if (order.purchaseType === 'CAPEX' && order.capexCodeId && order.amountEUR) {
          await tx.capexCode.update({
            where: { id: order.capexCodeId },
            data: { consumedEUR: { increment: order.amountEUR } }
          });
        }
        // ──────────────────────────────────────────────────────────────────────
      }

      return updatedOrder;
    });

    return res.json({ order: result });
  } catch (error: any) {
    console.error('Error al actualizar estado de requisición:', error);
    if (error.message && error.message.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
    }
    return res.status(500).json({ error: 'Error al actualizar la requisición' });
  }
});

// DELETE /api/purchase-orders/:id - Delete a requisition
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.purchaseOrder.delete({ where: { id } });
    return res.json({ message: 'Requisición eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error al eliminar requisición:', error);
    return res.status(500).json({ error: 'Error al eliminar la requisición' });
  }
});

export default router;
