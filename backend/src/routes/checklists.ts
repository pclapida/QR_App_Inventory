import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { authenticateToken, AuthenticatedRequest, ROLES } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// Checklist items definition (fixed for now, configurable by SUPERADMIN in future)
const CHECKLIST_TEMPLATE = {
  sectionA: [
    { id: 1, label: 'Cambiar nombre de PC' },
    { id: 2, label: 'Antivirus' },
    { id: 3, label: 'Falcon' },
    { id: 4, label: 'TeamViewer' },
    { id: 5, label: 'WiFi (LAP)' },
    { id: 6, label: 'Office' },
    { id: 7, label: 'Java' },
    { id: 8, label: 'Impresoras' },
    { id: 9, label: 'FortiClient (LAP)' },
    { id: 10, label: 'Configurar VPN (LAP)' },
    { id: 11, label: 'Revisar Drivers' },
    { id: 12, label: '7-Zip' },
    { id: 13, label: 'Adobe Reader' },
    { id: 14, label: 'Adobe Pro (Opcional)' },
    { id: 15, label: 'Actualizaciones' },
  ],
  sectionB: [
    { id: 16, label: 'Teams' },
    { id: 17, label: 'Correo (TODO)' },
    { id: 18, label: 'Infor' },
    { id: 19, label: 'Configurar Edge' },
    { id: 20, label: 'Pasar a Workstations en el AD' },
    { id: 21, label: 'Compartidas' },
    { id: 22, label: 'PDF Outbox (Opcional)' },
    { id: 23, label: 'Tress (Opcional)' },
    { id: 24, label: 'Responsiva' },
    { id: 25, label: 'Actualizar Objetos en el Forti' },
    { id: 26, label: 'Comprobar Manage Engine' },
    { id: 27, label: 'Orion (Opcional)' },
    { id: 28, label: 'CAPS' },
    { id: 29, label: 'Verificar Usuario en Lista de Distribución Administrative' },
    { id: 30, label: 'Agregar a Políticas BitLocker y USB\'s' },
  ]
};

const buildEmptyChecklist = () => ({
  sectionA: CHECKLIST_TEMPLATE.sectionA.map(item => ({ ...item, value: null as string | null })),
  sectionB: CHECKLIST_TEMPLATE.sectionB.map(item => ({ ...item, value: null as string | null })),
});

// GET /api/checklists/template - Return the checklist template items
router.get('/template', (_req, res) => {
  return res.json({ template: CHECKLIST_TEMPLATE });
});

// GET /api/checklists/item/:itemId - Get the active checklist for an item
router.get('/item/:itemId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    const checklist = await prisma.deviceChecklist.findFirst({
      where: { itemId, status: { in: ['IN_PROGRESS', 'COMPLETED'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        item: { select: { sku: true, name: true, plant: true } },
        createdBy: { select: { id: true, name: true, username: true, plant: true } }
      }
    });

    return res.json({ checklist: checklist ?? null });
  } catch (err: any) {
    console.error('Error fetching checklist:', err);
    return res.status(500).json({ error: 'Error al obtener el checklist del equipo' });
  }
});

// POST /api/checklists - Create a new checklist for an item
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'Se requiere el ID del equipo (itemId)' });
    }

    // Verify item exists
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // Void any previous in-progress checklist for this item
    await prisma.deviceChecklist.updateMany({
      where: { itemId, status: 'IN_PROGRESS' },
      data: { status: 'VOIDED' }
    });

    const emptyData = buildEmptyChecklist();
    const initialSignature = {
      userId: req.user!.id,
      userName: req.user!.name || req.user!.username,
      plant: req.user!.plant || null,
      role: req.user!.role,
      timestamp: new Date().toISOString(),
      sections: [] as string[]
    };

    const checklist = await prisma.deviceChecklist.create({
      data: {
        itemId,
        checklistData: JSON.stringify(emptyData),
        signaturesJson: JSON.stringify([initialSignature]),
        createdById: req.user!.id,
        status: 'IN_PROGRESS'
      }
    });

    return res.status(201).json({ checklist, message: 'Checklist iniciado exitosamente' });
  } catch (err: any) {
    console.error('Error creating checklist:', err);
    return res.status(500).json({ error: 'Error al crear el checklist' });
  }
});

// PUT /api/checklists/:id/items - Update checklist item values
router.put('/:id/items', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { checklistData, section } = req.body;

    if (!checklistData) {
      return res.status(400).json({ error: 'Se requieren los datos del checklist' });
    }

    const checklist = await prisma.deviceChecklist.findUnique({ where: { id } });
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist no encontrado' });
    }
    if (checklist.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Solo se puede editar un checklist en progreso' });
    }

    // Track which sections this user has edited
    const signatures: any[] = JSON.parse(checklist.signaturesJson || '[]');
    const existingSig = signatures.find((s: any) => s.userId === req.user!.id);
    if (existingSig && section && !existingSig.sections.includes(section)) {
      existingSig.sections.push(section);
      existingSig.timestamp = new Date().toISOString();
    } else if (!existingSig) {
      signatures.push({
        userId: req.user!.id,
        userName: req.user!.name || req.user!.username,
        plant: req.user!.plant || null,
        role: req.user!.role,
        timestamp: new Date().toISOString(),
        sections: section ? [section] : []
      });
    }

    const updated = await prisma.deviceChecklist.update({
      where: { id },
      data: {
        checklistData: JSON.stringify(checklistData),
        signaturesJson: JSON.stringify(signatures)
      }
    });

    return res.json({ checklist: updated, message: 'Checklist actualizado' });
  } catch (err: any) {
    console.error('Error updating checklist items:', err);
    return res.status(500).json({ error: 'Error al actualizar el checklist' });
  }
});

// POST /api/checklists/:id/sign - Add a co-signer with password verification
router.post('/:id/sign', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password, signerUserId, section } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Se requiere contraseña para firmar' });
    }

    const checklist = await prisma.deviceChecklist.findUnique({ where: { id } });
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist no encontrado' });
    }
    if (checklist.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Solo se puede firmar un checklist en progreso' });
    }

    // Determine which user is signing (the one authenticating, or a co-signer)
    const signingUserId = signerUserId || req.user!.id;
    const signingUser = await prisma.user.findUnique({ where: { id: signingUserId } });
    if (!signingUser) {
      return res.status(404).json({ error: 'Usuario firmante no encontrado' });
    }

    // Validate password against the signing user's stored password
    const isValid = await bcrypt.compare(password, signingUser.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta. No se pudo registrar la firma.' });
    }

    // Add/update signature record
    const signatures: any[] = JSON.parse(checklist.signaturesJson || '[]');
    const existingSig = signatures.find((s: any) => s.userId === signingUserId);
    if (existingSig) {
      existingSig.signed = true;
      existingSig.signedAt = new Date().toISOString();
      if (section && !existingSig.sections.includes(section)) {
        existingSig.sections.push(section);
      }
    } else {
      signatures.push({
        userId: signingUser.id,
        userName: signingUser.name || signingUser.username,
        plant: signingUser.plant || null,
        role: signingUser.role,
        timestamp: new Date().toISOString(),
        signedAt: new Date().toISOString(),
        signed: true,
        sections: section ? [section] : []
      });
    }

    const updated = await prisma.deviceChecklist.update({
      where: { id },
      data: { signaturesJson: JSON.stringify(signatures) }
    });

    return res.json({
      checklist: updated,
      message: `Firma de ${signingUser.name || signingUser.username} registrada exitosamente`
    });
  } catch (err: any) {
    console.error('Error signing checklist:', err);
    return res.status(500).json({ error: 'Error al registrar la firma del checklist' });
  }
});

// POST /api/checklists/:id/complete - Mark checklist as COMPLETED with final password validation
router.post('/:id/complete', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Se requiere contraseña para completar y cerrar el checklist' });
    }

    const checklist = await prisma.deviceChecklist.findUnique({ where: { id } });
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist no encontrado' });
    }
    if (checklist.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'El checklist ya fue completado o está anulado' });
    }

    // Verify password of the user completing the checklist
    const completingUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!completingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isValid = await bcrypt.compare(password, completingUser.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta. No se puede cerrar el checklist.' });
    }

    // Add completion signature
    const signatures: any[] = JSON.parse(checklist.signaturesJson || '[]');
    const existingSig = signatures.find((s: any) => s.userId === req.user!.id);
    if (existingSig) {
      existingSig.completedChecklist = true;
      existingSig.completedAt = new Date().toISOString();
    } else {
      signatures.push({
        userId: completingUser.id,
        userName: completingUser.name || completingUser.username,
        plant: completingUser.plant || null,
        role: completingUser.role,
        timestamp: new Date().toISOString(),
        completedChecklist: true,
        completedAt: new Date().toISOString(),
        sections: ['completion']
      });
    }

    const updated = await prisma.deviceChecklist.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        signaturesJson: JSON.stringify(signatures)
      }
    });

    return res.json({
      checklist: updated,
      message: 'Checklist completado y firmado exitosamente. Ahora puede proceder con la asignación del equipo.'
    });
  } catch (err: any) {
    console.error('Error completing checklist:', err);
    return res.status(500).json({ error: 'Error al completar el checklist' });
  }
});

export default router;
