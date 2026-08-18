import express, { Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// ─── GET /api/loans — Listar todos los préstamos ────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, itemId } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (itemId && typeof itemId === 'string') {
      where.itemId = itemId;
    }

    const loans = await prisma.deviceLoan.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
            model: true,
            serialNumber: true,
            category: true,
            plant: true,
            area: true,
            isITInternal: true
          }
        }
      },
      orderBy: { loanDate: 'desc' }
    });

    // Check overdue status on the fly
    const now = new Date();
    const formattedLoans = loans.map((loan) => {
      const isOverdue = loan.status === 'ACTIVE' && new Date(loan.expectedReturn) < now;
      return {
        ...loan,
        isOverdue,
        status: isOverdue ? 'OVERDUE' : loan.status
      };
    });

    res.json(formattedLoans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Error al consultar los préstamos' });
  }
});

// ─── POST /api/loans — Registrar nuevo préstamo de equipo ───────────────────
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      itemId,
      borrowerName,
      borrowerArea,
      borrowerBadge,
      expectedReturn,
      loanNotes
    } = req.body;

    if (!itemId || !borrowerName || !expectedReturn) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (Equipo, Solicitante o Fecha de Retorno)' });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const technicianName = req.user?.name || req.user?.username || 'Técnico IT';

    const [newLoan] = await prisma.$transaction([
      prisma.deviceLoan.create({
        data: {
          itemId,
          borrowerName,
          borrowerArea: borrowerArea || null,
          borrowerBadge: borrowerBadge || null,
          expectedReturn: new Date(expectedReturn),
          loanNotes: loanNotes || null,
          loanedBy: technicianName,
          status: 'ACTIVE'
        },
        include: { item: true }
      }),
      prisma.transaction.create({
        data: {
          itemId,
          userId: req.user!.id,
          type: 'PRÉSTAMO',
          quantity: 1,
          assignedTo: borrowerName,
          notes: `Préstamo temporal IT a ${borrowerName} (${borrowerArea || 'Planta'}). Retorno esperado: ${new Date(expectedReturn).toLocaleDateString()}`
        }
      })
    ]);

    res.status(201).json(newLoan);
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ error: 'Error al registrar el préstamo de equipo' });
  }
});

// ─── PUT /api/loans/:id/return — Registrar devolución en 1 clic ────────────
router.put('/:id/return', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { returnNotes } = req.body;

    const existingLoan = await prisma.deviceLoan.findUnique({
      where: { id },
      include: { item: true }
    });

    if (!existingLoan) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    const technicianName = req.user?.name || req.user?.username || 'Técnico IT';

    const [updatedLoan] = await prisma.$transaction([
      prisma.deviceLoan.update({
        where: { id },
        data: {
          status: 'RETURNED',
          actualReturn: new Date(),
          receivedBy: technicianName,
          returnNotes: returnNotes || null
        },
        include: { item: true }
      }),
      prisma.transaction.create({
        data: {
          itemId: existingLoan.itemId,
          userId: req.user!.id,
          type: 'DEVOLUCIÓN',
          quantity: 1,
          assignedTo: 'Almacén IT',
          notes: `Devolución de préstamo por ${existingLoan.borrowerName}. Recibido por ${technicianName}.`
        }
      })
    ]);

    res.json(updatedLoan);
  } catch (error) {
    console.error('Error returning loan:', error);
    res.status(500).json({ error: 'Error al registrar la devolución del equipo' });
  }
});

// ─── DELETE /api/loans/:id — Eliminar registro de préstamo (Admin) ─────────
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.deviceLoan.delete({ where: { id } });
    res.json({ message: 'Registro de préstamo eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({ error: 'Error al eliminar el registro de préstamo' });
  }
});

export default router;
