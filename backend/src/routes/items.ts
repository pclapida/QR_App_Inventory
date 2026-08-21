import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { prisma } from '../utils/prisma';
import { authenticateToken, requireAdmin, AuthenticatedRequest, ROLES } from '../middleware/auth';

const router = Router();

// Multer: memory storage with 10MB cap and Excel-only filter
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'application/csv'];
    const allowedExts = ['.xlsx', '.xls', '.csv'];
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV'));
    }
  }
});

router.use(authenticateToken);

const cleanKey = (key: string): string => {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

const determinePlant = (name: string, sku: string, model: string, defaultPlant: string): string => {
  const text = `${name || ''} ${sku || ''} ${model || ''} ${defaultPlant || ''}`.toLowerCase();
  if (text.includes('upcast') || text.includes('cofud')) return 'Planta UPCAST';
  return 'Planta 2';
};

const determineCategory = (name: string, model: string, defaultCategory: string): string => {
  const text = `${name || ''} ${model || ''}`.toLowerCase();
  
  if (text.includes('laptop') || text.includes('notebook')) return 'Laptops';
  if (text.includes('monitor') || text.includes('pantalla')) return 'Monitores';
  if (text.includes('mini pc') || text.includes('minipc') || text.includes('desktop') || text.includes('optiplex') || text.includes('thinkcentre')) return 'Mini PCs & Desktops';
  if (text.includes('tablet') || text.includes('ipad') || text.includes('galaxy tab')) return 'Tablets';
  if (text.includes('zebra') || text.includes('impresora') || text.includes('printer')) return 'Impresoras Zebra';
  if (text.includes('scanner') || text.includes('escáner') || text.includes('escaner') || text.includes('lector')) return 'Scanners';
  if (text.includes('usb') || text.includes('pendrive')) return 'Accesorios USB';
  if (text.includes('teclado') || text.includes('mouse') || text.includes('raton')) return 'Periféricos';
  
  return defaultCategory;
};

// POST /api/items/import-excel
router.post('/import-excel', requireAdmin, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Por favor seleccione un archivo Excel (.xlsx, .xls o .csv)' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ error: 'El archivo Excel no contiene filas de datos' });
    }

    let successCount = 0;
    const errors: string[] = [];

    // Pre-load all existing SKUs into a memory Set for O(1) conflict resolution (20x faster)
    const existingList = await prisma.item.findMany({ select: { sku: true } });
    const knownSkus = new Set(existingList.map((i) => i.sku.toUpperCase()));

    const itemsToCreate: any[] = [];

    for (let index = 0; index < rawData.length; index++) {
      const row = rawData[index];
      
      const normRow: { [key: string]: any } = {};
      Object.keys(row).forEach((k) => {
        normRow[cleanKey(k)] = String(row[k]).trim();
      });

      const name = normRow['nombre'] || normRow['nombredelequipo'] || normRow['equipo'] || normRow['articulo'] || normRow['producto'] || normRow['descripcion'] || '';
      const model = normRow['modelo'] || normRow['mod'] || '';
      const serialNumber = normRow['numerodeserie'] || normRow['serie'] || normRow['sn'] || normRow['nserie'] || '';
      const area = normRow['area'] || normRow['departamento'] || normRow['ubicacion'] || normRow['seccion'] || '';
      const ipAddress = normRow['ip'] || normRow['direccionip'] || normRow['ipaddress'] || '';
      const faults = normRow['fallas'] || normRow['defectos'] || normRow['fallos'] || '';
      const notes = normRow['observaciones'] || normRow['notas'] || normRow['comentarios'] || '';
      const category = normRow['categoria'] || normRow['tipo'] || 'Equipos & Dispositivos';
      const stockStr = normRow['stock'] || normRow['cantidad'] || normRow['cant'] || '1';
      const skuStr = normRow['sku'] || normRow['codigo'] || normRow['codigointerno'] || '';
      const warrantyExp = normRow['fechagarantia'] || normRow['garantia'] || '';

      if (!name) {
        errors.push(`Fila ${index + 2}: Nombre del producto u objeto omitido.`);
        continue;
      }

      const stock = parseInt(stockStr, 10) || 1;
      const newItemId = uuidv4();
      let finalSku = skuStr ? skuStr.toUpperCase() : '';

      if (!finalSku) {
        const randomPart = Math.floor(10000 + Math.random() * 90000);
        finalSku = `IMP-${randomPart}`;
      }

      while (knownSkus.has(finalSku)) {
        finalSku = `${finalSku}-${Math.floor(100 + Math.random() * 900)}`;
      }
      knownSkus.add(finalSku);

      const isIT = Boolean(area && ['it', 'sistemas', 'taller it', 'taller interno it'].includes(area.toLowerCase().trim()));
      const qrCodePayload = `INV-${newItemId}`;

      itemsToCreate.push({
        id: newItemId,
        sku: finalSku,
        name: name,
        model: model || null,
        serialNumber: serialNumber || null,
        notes: notes || null,
        faults: faults || null,
        area: area || null,
        ipAddress: ipAddress || null,
        hasWarranty: !!warrantyExp,
        warrantyExpiration: warrantyExp || null,
        category: determineCategory(name, model, category || 'Equipos & Dispositivos'),
        stock: stock,
        minStock: 1,
        unit: 'unidad',
        location: isIT ? 'Taller Interno IT' : (area || null),
        plant: determinePlant(name, finalSku, model, 'Planta 2'),
        isITInternal: isIT,
        qrCodePayload
      });
    }

    // Insert items in batches of 50 using transactions for high performance
    const chunkSize = 50;
    for (let i = 0; i < itemsToCreate.length; i += chunkSize) {
      const chunk = itemsToCreate.slice(i, i + chunkSize);
      try {
        await prisma.$transaction(
          chunk.map((data) => prisma.item.create({ data }))
        );
        successCount += chunk.length;
      } catch (err: any) {
        console.error(`Error al insertar lote ${i / chunkSize + 1}:`, err);
        // Fallback: insert individually if any item in batch fails
        for (const itemData of chunk) {
          try {
            await prisma.item.create({ data: itemData });
            successCount++;
          } catch (individualErr: any) {
            errors.push(`Error en "${itemData.name}": ${individualErr.message}`);
          }
        }
      }
    }

    return res.json({
      message: `Importación completada. Se importaron ${successCount} registros exitosamente.`,
      importedCount: successCount,
      errors
    });
  } catch (error: any) {
    console.error('Error al procesar archivo Excel:', error);
    return res.status(500).json({ error: 'Error al procesar el archivo Excel. Verifique el formato.' });
  }
});

// GET /api/items/global-search - Cross-plant search (read-only, accessible to all authenticated roles)
// Used for the "Consulta de Inventario entre Plantas" dashboard
router.get('/global-search', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({ error: 'Se requiere un término de búsqueda de al menos 2 caracteres' });
    }

    const query = q.trim();
    const items = await prisma.item.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { serialNumber: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } },
          { assignedTo: { contains: query, mode: 'insensitive' } },
          { ipAddress: { contains: query, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        sku: true,
        name: true,
        model: true,
        serialNumber: true,
        plant: true,
        originPlant: true,
        status: true,
        assignedTo: true,
        assignedArea: true,
        category: true,
        ipAddress: true,
        isITInternal: true,
      },
      take: 50,
      orderBy: { plant: 'asc' }
    });

    return res.json({ items, total: items.length, query });
  } catch (err: any) {
    console.error('Error en global-search:', err);
    return res.status(500).json({ error: 'Error al realizar la búsqueda global de inventario' });
  }
});

// GET /api/items - List all items with optional pagination and filters
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, category, plant, isITInternal, status, tab, page, limit, lowStock } = req.query;
    const whereClause: any = {};

    // Tab-based filtering for the 6-state lifecycle
    if (tab === 'ASSIGNED') {
      whereClause.status = 'ACTIVE';
      whereClause.isITInternal = false;
    } else if (tab === 'AVAILABLE') {
      whereClause.status = 'ACTIVE';
      whereClause.isITInternal = true;
    } else if (tab === 'SCRAP') {
      whereClause.status = 'DECOMMISSIONED';
    } else if (tab === 'DAMAGED') {
      whereClause.status = 'ACTIVE';
      whereClause.faults = { not: null };
    } else if (tab === 'TRANSFERS') {
      const transferItemIds = await prisma.$queryRaw<{id: string}[]>`
        SELECT id FROM "Item" WHERE status = 'ACTIVE' AND "originPlant" IS NOT NULL AND "originPlant" != plant
      `;
      whereClause.id = { in: transferItemIds.map(r => r.id) };
    } else {
      if (status && typeof status === 'string' && status.trim() !== '') {
        if (status.toUpperCase() !== 'ALL') {
          whereClause.status = status.toUpperCase();
        }
      } else {
        whereClause.status = 'ACTIVE';
      }

      if (isITInternal !== undefined && isITInternal !== '') {
        whereClause.isITInternal = isITInternal === 'true' || isITInternal === '1';
      }
    }

    if (category && typeof category === 'string' && category.trim() !== '') {
      whereClause.category = category.trim();
    }

    if (plant && typeof plant === 'string' && plant.trim() !== '') {
      whereClause.plant = plant.trim();
    }

    if (q && typeof q === 'string' && q.trim() !== '') {
      const query = q.trim();
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { model: { contains: query, mode: 'insensitive' } },
        { serialNumber: { contains: query, mode: 'insensitive' } },
        { area: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
        { assignedTo: { contains: query, mode: 'insensitive' } },
        { plant: { contains: query, mode: 'insensitive' } },
        { ipAddress: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } },
        { faults: { contains: query, mode: 'insensitive' } },
        { customAttributes: { contains: query, mode: 'insensitive' } },
        { qrCodePayload: { contains: query, mode: 'insensitive' } },
        { id: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (lowStock === 'true') {
      const lowStockIds = await prisma.$queryRaw<{id: string}[]>`SELECT id FROM "Item" WHERE stock = 0 OR ("minStock" > 0 AND stock <= "minStock")`;
      whereClause.id = { in: lowStockIds.map(row => row.id) };
    }

    // Pagination — defaults to no limit for backwards compatibility when page not provided
    const pageNum  = page  ? Math.max(1, parseInt(page  as string, 10)) : null;
    const limitNum = limit ? Math.min(200, Math.max(1, parseInt(limit as string, 10))) : null;
    const skip = (pageNum && limitNum) ? (pageNum - 1) * limitNum : undefined;

    const [items, total] = await prisma.$transaction([
      prisma.item.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum ?? undefined,
        include: {
          maintenances: {
            take: 1,
            orderBy: { performedAt: 'desc' }
          },
          _count: {
            select: { transactions: true }
          }
        }
      }),
      prisma.item.count({ where: whereClause })
    ]);

    // Security: sanitize bitlockerKey and devicePassword in general list to prevent exposure in network payloads
    const sanitizedItems = items.map((item) => ({
      ...item,
      bitlockerKey: item.bitlockerKey ? '••••••••' : null,
      devicePassword: item.devicePassword ? '••••••••' : null,
      hasSecurityConfigured: Boolean(item.bitlockerKey || item.devicePassword)
    }));

    return res.json({
      items: sanitizedItems,
      total,
      page: pageNum ?? 1,
      totalPages: (pageNum && limitNum) ? Math.ceil(total / limitNum) : 1
    });
  } catch (error: any) {
    console.error('Error al listar artículos:', error);
    return res.status(500).json({ error: 'Error interno al consultar inventario' });
  }
});

// GET /api/items/scan/:code
router.get('/scan/:code', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const code = decodeURIComponent(req.params.code).trim();

    if (!code) {
      return res.status(400).json({ error: 'Código de escaneo no válido' });
    }

    const item = await prisma.item.findFirst({
      where: {
        OR: [
          { qrCodePayload: code },
          { id: code },
          { sku: code },
          { serialNumber: code }
        ]
      },
      include: {
        maintenances: {
          take: 1,
          orderBy: { performedAt: 'desc' }
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, username: true } }
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: `No se encontró ningún artículo registrado con el código: ${code}` });
    }

    return res.json({ item });
  } catch (error: any) {
    console.error('Error al buscar artículo por escaneo:', error);
    return res.status(500).json({ error: 'Error al procesar el código de escaneo' });
  }
});

// GET /api/items/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        maintenances: {
          take: 1,
          orderBy: { performedAt: 'desc' }
        },
        transactions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, username: true } }
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    return res.json({ item });
  } catch (error: any) {
    console.error('Error al obtener artículo:', error);
    return res.status(500).json({ error: 'Error al obtener detalle del artículo' });
  }
});

// GET /api/items/:id/security-keys - Retrieve BitLocker and device password (Admin only + Audit Log)
router.get('/:id/security-keys', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        sku: true,
        bitlockerKey: true,
        devicePassword: true,
        plant: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Register audit transaction
    await prisma.transaction.create({
      data: {
        itemId: id,
        userId: req.user.id,
        type: 'EDIT',
        quantity: 0,
        fromPlant: item.plant,
        toPlant: item.plant,
        notes: `Consulta de credenciales y clave BitLocker por ${req.user.name || req.user.username || 'Admin'}`
      }
    }).catch((err) => {
      console.warn('Advertencia al registrar auditoría de seguridad:', err);
    });

    return res.json({
      bitlockerKey: item.bitlockerKey,
      devicePassword: item.devicePassword
    });
  } catch (error: any) {
    console.error('Error al consultar claves de seguridad:', error);
    return res.status(500).json({ error: 'Error al consultar claves de seguridad' });
  }
});

// POST /api/items
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      model,
      serialNumber,
      notes,
      faults,
      area,
      ipAddress,
      hasWarranty,
      warrantyExpiration,
      stock,
      minStock,
      unit,
      sku,
      category,
      plant,
      location,
      description,
      isITInternal,
      assignedTo,
      customAttributes,
      bitlockerKey,
      devicePassword
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre del artículo es obligatorio' });
    }

    const newItemId = uuidv4();
    const finalSku = sku && sku.trim() !== '' ? sku.trim().toUpperCase() : `COF-${newItemId.substring(0, 8).toUpperCase()}`;

    const existingSku = await prisma.item.findUnique({ where: { sku: finalSku } });
    if (existingSku) {
      return res.status(400).json({ error: `Ya existe un artículo registrado con el SKU: ${finalSku}` });
    }

    const qrCodePayload = `INV-${newItemId}`;
    const isIT = typeof isITInternal === 'boolean'
      ? isITInternal
      : (isITInternal === 'true' || isITInternal === '1' || Boolean(area && ['it', 'sistemas', 'taller it', 'taller interno it'].includes(area.toLowerCase().trim())));

    let customAttrStr: string | null = null;
    if (customAttributes) {
      customAttrStr = typeof customAttributes === 'string' ? customAttributes : JSON.stringify(customAttributes);
    }

    const itemPlant = determinePlant(name.trim(), finalSku, model ? model.trim() : '', plant ? plant.trim() : 'Planta 2');

    const item = await prisma.item.create({
      data: {
        id: newItemId,
        sku: finalSku,
        name: name.trim(),
        model: model ? model.trim() : null,
        serialNumber: serialNumber ? serialNumber.trim() : null,
        notes: notes ? notes.trim() : null,
        faults: faults ? faults.trim() : null,
        area: area ? area.trim() : null,
        ipAddress: ipAddress ? ipAddress.trim() : null,
        hasWarranty: typeof hasWarranty === 'boolean' ? hasWarranty : hasWarranty === 'true',
        warrantyExpiration: warrantyExpiration ? warrantyExpiration.trim() : null,
        description: description ? description.trim() : null,
        category: determineCategory(name.trim(), model ? model.trim() : '', category ? category.trim() : 'Equipos & Dispositivos'),
        plant: itemPlant,
        originPlant: itemPlant,
        isITInternal: true, // Always enters IT Available Inventory
        assignedTo: null,
        customAttributes: customAttrStr,
        bitlockerKey: bitlockerKey ? bitlockerKey.trim() : null,
        devicePassword: devicePassword ? devicePassword.trim() : null,
        stock: typeof stock === 'number' ? stock : parseInt(stock || '1', 10),
        minStock: typeof minStock === 'number' ? minStock : parseInt(minStock || '1', 10),
        unit: unit ? unit.trim() : 'unidad',
        location: location ? location.trim() : 'Taller Interno IT',
        qrCodePayload
      }
    });

    // Create history transaction for new item creation
    await prisma.transaction.create({
      data: {
        itemId: item.id,
        userId: req.user!.id,
        type: 'CREATION',
        quantity: item.stock,
        toPlant: item.plant,
        notes: `Alta de equipo registrado en Inventario Disponible (${item.plant})`
      }
    });

    return res.status(201).json({ item });
  } catch (error: any) {
    console.error('Error al crear artículo:', error);
    return res.status(500).json({ error: 'Error al registrar el nuevo artículo' });
  }
});

// POST /api/items/:id/assign - Assign an available IT item to a collaborator with digital responsiva
router.post('/:id/assign', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      colaborador,
      area,
      badge,
      marcaModelo,
      serie,
      nombreEquipo,
      accesoriosJson,
      observaciones,
      photoUrlsJson,
      signatureData,
      email
    } = req.body;

    if (!colaborador || !colaborador.trim()) {
      return res.status(400).json({ error: 'El nombre del colaborador es obligatorio para la asignación.' });
    }

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    if (!isSuperAdmin && item.plant !== req.user?.plant) {
      return res.status(403).json({ error: 'No tienes permisos para asignar artículos de otras plantas.' });
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      const updated = await tx.item.update({
        where: { id },
        data: {
          assignedTo: colaborador.trim(),
          assignedArea: area ? area.trim() : null,
          assignedBadge: badge ? badge.trim() : null,
          assignedDate: new Date(),
          area: area ? area.trim() : item.area,
          location: area ? area.trim() : item.plant,
          isITInternal: false,
          status: 'ACTIVE'
        }
      });

      // Create Responsiva Record
      await tx.responsivaHistory.create({
        data: {
          itemId: id,
          colaborador: colaborador.trim(),
          marcaModelo: marcaModelo || `${item.name} ${item.model || ''}`.trim(),
          serie: serie || item.serialNumber || 'N/A',
          nombreEquipo: nombreEquipo || item.sku,
          accesoriosJson: accesoriosJson ? (typeof accesoriosJson === 'string' ? accesoriosJson : JSON.stringify(accesoriosJson)) : '{}',
          observaciones: observaciones ? observaciones.trim() : null,
          photoUrlsJson: photoUrlsJson ? (typeof photoUrlsJson === 'string' ? photoUrlsJson : JSON.stringify(photoUrlsJson)) : '[]',
          signatureData: signatureData || null,
          email: email ? email.trim() : null,
          emailSent: false
        }
      });

      // Audit transaction
      await tx.transaction.create({
        data: {
          itemId: id,
          userId: req.user!.id,
          type: 'ASIGNACIÓN',
          quantity: 1,
          assignedTo: colaborador.trim(),
          fromPlant: item.plant,
          toPlant: item.plant,
          notes: `Equipo asignado a ${colaborador.trim()} (${area || 'Sin área'}) con Responsiva digital firmada`
        }
      });

      return updated;
    });

    return res.json({ message: `Equipo asignado exitosamente a ${colaborador.trim()}`, item: updatedItem });
  } catch (error: any) {
    console.error('Error al asignar artículo:', error);
    return res.status(500).json({ error: 'Error al procesar la asignación del equipo.' });
  }
});

// POST /api/items/:id/unassign - Return an assigned item back to IT Workshop (Disponible)
router.post('/:id/unassign', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    if (!isSuperAdmin && item.plant !== req.user?.plant) {
      return res.status(403).json({ error: 'No tienes permisos para desasignar artículos de otras plantas.' });
    }

    const previousOwner = item.assignedTo || 'Colaborador';

    const updatedItem = await prisma.$transaction(async (tx) => {
      const updated = await tx.item.update({
        where: { id },
        data: {
          assignedTo: null,
          assignedArea: null,
          assignedBadge: null,
          assignedDate: null,
          isITInternal: true,
          location: 'Taller Interno IT'
        }
      });

      await tx.transaction.create({
        data: {
          itemId: id,
          userId: req.user!.id,
          type: 'DEVOLUCIÓN_IT',
          quantity: 1,
          fromPlant: item.plant,
          toPlant: item.plant,
          notes: `Retiro de equipo de ${previousOwner} y retorno a Inventario Disponible de IT. ${notes ? `Notas: ${notes}` : ''}`
        }
      });

      // Void any past checklists so subsequent assignment demands a brand new checklist
      await tx.deviceChecklist.updateMany({
        where: { itemId: id, status: { in: ['IN_PROGRESS', 'COMPLETED'] } },
        data: { status: 'VOIDED' }
      });

      return updated;
    });

    return res.json({ message: `Equipo retornado a Inventario Disponible de IT`, item: updatedItem });
  } catch (error: any) {
    console.error('Error al desasignar artículo:', error);
    return res.status(500).json({ error: 'Error al devolver el artículo al inventario disponible.' });
  }
});

// POST /api/items/:id/report-fault - Mark an item as damaged with fault description
router.post('/:id/report-fault', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { faults, notes } = req.body;

    if (!faults || !faults.trim()) {
      return res.status(400).json({ error: 'Debe especificar el motivo o descripción del daño / falla.' });
    }

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    if (!isSuperAdmin && item.plant !== req.user?.plant) {
      return res.status(403).json({ error: 'No tienes permisos para modificar artículos de otras plantas.' });
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      const updated = await tx.item.update({
        where: { id },
        data: {
          faults: faults.trim(),
          notes: notes ? (item.notes ? `${item.notes}\n[Falla Reportada]: ${notes.trim()}` : `[Falla Reportada]: ${notes.trim()}`) : item.notes
        }
      });

      await tx.transaction.create({
        data: {
          itemId: id,
          userId: req.user!.id,
          type: 'FALLA_REPORTADA',
          quantity: 1,
          fromPlant: item.plant,
          toPlant: item.plant,
          notes: `Falla/Daño reportado: "${faults.trim()}". ${notes ? `Notas: ${notes.trim()}` : ''}`
        }
      });

      return updated;
    });

    return res.json({ message: `Falla registrada. El equipo se encuentra en el apartado de Dañados.`, item: updatedItem });
  } catch (error: any) {
    console.error('Error al reportar falla:', error);
    return res.status(500).json({ error: 'Error al registrar la falla del equipo.' });
  }
});

// POST /api/items/:id/repair - Mark a damaged item as repaired/resolved and return to IT Available
router.post('/:id/repair', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    if (!isSuperAdmin && item.plant !== req.user?.plant) {
      return res.status(403).json({ error: 'No tienes permisos para reparar artículos de otras plantas.' });
    }

    const previousFault = item.faults || 'Falla técnica';

    const updatedItem = await prisma.$transaction(async (tx) => {
      const updated = await tx.item.update({
        where: { id },
        data: {
          faults: null,
          isITInternal: true,
          location: 'Taller Interno IT'
        }
      });

      await tx.transaction.create({
        data: {
          itemId: id,
          userId: req.user!.id,
          type: 'REPARACIÓN_COMPLETADA',
          quantity: 1,
          fromPlant: item.plant,
          toPlant: item.plant,
          notes: `Equipo reparado (Falla previa: "${previousFault}"). Retornado a Inventario Disponible de IT. ${notes ? `Detalles: ${notes.trim()}` : ''}`
        }
      });

      return updated;
    });

    return res.json({ message: `Equipo marcado como reparado y retornado al Inventario Disponible de IT.`, item: updatedItem });
  } catch (error: any) {
    console.error('Error al marcar como reparado:', error);
    return res.status(500).json({ error: 'Error al procesar la reparación del equipo.' });
  }
});

// POST /api/items/:id/transfer - Quick plant transfer endpoint
router.post('/:id/transfer', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { targetPlant, notes } = req.body;

    if (!targetPlant || !targetPlant.trim()) {
      return res.status(400).json({ error: 'Debe especificar la planta de destino' });
    }

    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    if (!isSuperAdmin && existing.plant !== req.user?.plant) {
      return res.status(403).json({ error: 'No tienes permisos para transferir artículos de otras plantas.' });
    }

    const fromPlant = existing.plant;
    const newPlant = targetPlant.trim();

    if (fromPlant === newPlant) {
      return res.status(400).json({ error: `El artículo ya se encuentra en ${newPlant}` });
    }

    const originalOrigin = existing.originPlant || fromPlant;
    const finalOrigin = newPlant === originalOrigin ? null : originalOrigin;

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        plant: newPlant,
        originPlant: finalOrigin,
        location: existing.area ? `${existing.area} (${newPlant})` : `Almacén IT (${newPlant})`
      }
    });

    // Log plant transfer transaction in history
    await prisma.transaction.create({
      data: {
        itemId: id,
        userId: req.user!.id,
        type: 'TRANSFER',
        quantity: 1,
        fromPlant: fromPlant,
        toPlant: newPlant,
        notes: notes ? notes.trim() : `Traslado de ${fromPlant} ➔ ${newPlant}`
      }
    });

    return res.json({
      message: `Artículo trasladado exitosamente a ${newPlant}`,
      item: updatedItem
    });
  } catch (error: any) {
    console.error('Error al trasladar artículo de planta:', error);
    return res.status(500).json({ error: 'Error al procesar el traslado de planta' });
  }
});

// PUT /api/items/:id
router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      model,
      serialNumber,
      notes,
      faults,
      area,
      ipAddress,
      hasWarranty,
      warrantyExpiration,
      stock,
      minStock,
      unit,
      sku,
      category,
      plant,
      location,
      description,
      isITInternal,
      assignedTo,
      customAttributes,
      bitlockerKey,
      devicePassword
    } = req.body;

    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    if (sku && sku.trim().toUpperCase() !== existing.sku) {
      const skuCheck = await prisma.item.findUnique({ where: { sku: sku.trim().toUpperCase() } });
      if (skuCheck) {
        return res.status(400).json({ error: 'El SKU especificado ya está en uso' });
      }
    }

    // Backend lock check for transferred items
    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    const isTransferred = existing.originPlant && existing.plant !== existing.originPlant;
    const isLocked = !isSuperAdmin && isTransferred && req.user?.plant !== existing.originPlant;

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedSku = (sku !== undefined && !isLocked) ? sku.trim().toUpperCase() : existing.sku;
    const updatedModel = (model !== undefined && !isLocked) ? model : existing.model;
    const updatedSerial = (serialNumber !== undefined && !isLocked) ? serialNumber : existing.serialNumber;
    
    const explicitPlant = plant !== undefined ? plant.trim() : existing.plant;
    const newPlant = determinePlant(updatedName, updatedSku, updatedModel || '', explicitPlant);
    const plantChanged = newPlant !== existing.plant;

    let customAttrStr = existing.customAttributes;
    if (customAttributes !== undefined && !isLocked) {
      customAttrStr = customAttributes ? (typeof customAttributes === 'string' ? customAttributes : JSON.stringify(customAttributes)) : null;
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name: updatedName,
        model: updatedModel,
        serialNumber: updatedSerial,
        notes: notes !== undefined ? notes : existing.notes,
        faults: faults !== undefined ? faults : existing.faults,
        area: area !== undefined ? area : existing.area,
        ipAddress: ipAddress !== undefined ? ipAddress : existing.ipAddress,
        sku: updatedSku,
        hasWarranty: hasWarranty !== undefined ? Boolean(hasWarranty) : existing.hasWarranty,
        warrantyExpiration: warrantyExpiration !== undefined ? warrantyExpiration : existing.warrantyExpiration,
        description: description !== undefined ? description : existing.description,
        category: category !== undefined ? determineCategory(updatedName, updatedModel || '', category) : determineCategory(updatedName, updatedModel || '', existing.category || 'Equipos & Dispositivos'),
        plant: newPlant,
        isITInternal: isITInternal !== undefined
          ? Boolean(isITInternal)
          : (area !== undefined && area && ['it', 'sistemas', 'taller it', 'taller interno it'].includes(area.toLowerCase().trim()) ? true : existing.isITInternal),
        assignedTo: assignedTo !== undefined ? (assignedTo ? assignedTo.trim() : null) : existing.assignedTo,
        customAttributes: customAttrStr,
        bitlockerKey: bitlockerKey !== undefined ? (bitlockerKey ? bitlockerKey.trim() : null) : existing.bitlockerKey,
        devicePassword: devicePassword !== undefined ? (devicePassword ? devicePassword.trim() : null) : existing.devicePassword,
        minStock: minStock !== undefined ? parseInt(minStock, 10) : existing.minStock,
        unit: unit !== undefined ? unit : existing.unit,
        location: location !== undefined ? location : existing.location,
        stock: stock !== undefined ? parseInt(stock, 10) : existing.stock
      }
    });

    // Record change in history
    if (plantChanged) {
      await prisma.transaction.create({
        data: {
          itemId: id,
          userId: req.user!.id,
          type: 'TRANSFER',
          quantity: 1,
          fromPlant: existing.plant,
          toPlant: newPlant,
          notes: `Cambio de ubicación: ${existing.plant} ➔ ${newPlant}`
        }
      });
    } else {
      await prisma.transaction.create({
        data: {
          itemId: id,
          userId: req.user!.id,
          type: 'EDIT',
          quantity: 1,
          fromPlant: existing.plant,
          toPlant: newPlant,
          notes: `Actualización de información del artículo`
        }
      });
    }

    return res.json({ item: updatedItem });
  } catch (error: any) {
    console.error('Error al actualizar artículo:', error);
    return res.status(500).json({ error: 'Error al actualizar el artículo' });
  }
});

// POST /api/items/:id/decommission - Decommission / Scrap an asset
router.post('/:id/decommission', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, notes, responsiblePerson, disposalMethod, decommissionActNumber } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'El motivo de la baja es obligatorio.' });
    }

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    if (!isSuperAdmin && item.plant !== req.user?.plant) {
      return res.status(403).json({ error: 'No tienes permisos para dar de baja artículos de otras plantas.' });
    }

    const year = new Date().getFullYear();
    const randomSuffix = uuidv4().split('-')[0].toUpperCase();
    const finalActNumber = decommissionActNumber && decommissionActNumber.trim()
      ? decommissionActNumber.trim()
      : `BAJA-${year}-${randomSuffix}`;

    const authorizer = responsiblePerson && responsiblePerson.trim()
      ? responsiblePerson.trim()
      : (req.user?.username || 'Admin');

    const updatedItem = await prisma.$transaction(async (tx) => {
      const updated = await tx.item.update({
        where: { id },
        data: {
          status: 'DECOMMISSIONED',
          stock: 0,
          assignedTo: null,
          decommissionDate: new Date(),
          decommissionReason: reason.trim(),
          decommissionNotes: notes ? notes.trim() : null,
          decommissionedBy: authorizer,
          disposalMethod: disposalMethod ? disposalMethod.trim() : 'Contenedor E-Waste / Desecho',
          decommissionActNumber: finalActNumber
        }
      });

      await tx.transaction.create({
        data: {
          itemId: id,
          userId: req.user!.id,
          type: 'DECOMMISSION',
          quantity: item.stock || 1,
          fromPlant: item.plant,
          toPlant: 'SCRAP / E-WASTE',
          notes: `Baja de activo / Scrap (${finalActNumber}): Motivo: ${reason}. Disposición: ${disposalMethod || 'E-Waste'}. ${notes ? `Notas: ${notes}` : ''}`
        }
      });

      return updated;
    });

    return res.json({ item: updatedItem, message: `Equipo ${item.name} dado de baja exitosamente con acta ${finalActNumber}.` });
  } catch (error: any) {
    console.error('Error al dar de baja el artículo:', error);
    return res.status(500).json({ error: 'Error al procesar la baja del artículo.' });
  }
});

// POST /api/items/:id/reactivate - Reactivate a decommissioned asset
router.post('/:id/reactivate', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newStock, notes } = req.body;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    if (!isSuperAdmin && item.plant !== req.user?.plant) {
      return res.status(403).json({ error: 'No tienes permisos para reactivar artículos de otras plantas.' });
    }

    const stockVal = newStock !== undefined ? parseInt(newStock, 10) : 1;

    const updatedItem = await prisma.$transaction(async (tx) => {
      const updated = await tx.item.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          stock: isNaN(stockVal) || stockVal < 1 ? 1 : stockVal,
          decommissionDate: null,
          decommissionReason: null,
          decommissionNotes: null,
          decommissionedBy: null,
          disposalMethod: null,
          decommissionActNumber: null
        }
      });

      await tx.transaction.create({
        data: {
          itemId: id,
          userId: req.user!.id,
          type: 'REACTIVATE',
          quantity: updated.stock,
          fromPlant: 'SCRAP / E-WASTE',
          toPlant: item.plant,
          notes: `Reactivación de activo al inventario activo. ${notes ? `Notas: ${notes}` : ''}`
        }
      });

      return updated;
    });

    return res.json({ item: updatedItem, message: `Equipo ${item.name} reactivado exitosamente.` });
  } catch (error: any) {
    console.error('Error al reactivar artículo:', error);
    return res.status(500).json({ error: 'Error al reactivar el artículo.' });
  }
});

// GET /api/items/:id/timeline - Unified Asset Lifecycle Timeline
router.get('/:id/timeline', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, username: true } }
          }
        },
        maintenances: {
          orderBy: { performedAt: 'desc' }
        },
        responsivas: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    // Build timeline events array
    const events: Array<{
      id: string;
      type: 'CREATION' | 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'EDIT' | 'MAINTENANCE' | 'RESPONSIVA' | 'DECOMMISSION' | 'REACTIVATE';
      title: string;
      description: string;
      date: string;
      performedBy: string;
      meta?: Record<string, any>;
    }> = [];

    // 1. Initial Creation Event
    events.push({
      id: `creation-${item.id}`,
      type: 'CREATION',
      title: 'Alta de Activo en Inventario',
      description: `Registro inicial de "${item.name}" en ${item.plant || 'Planta 2'}${item.area ? ` (Área: ${item.area})` : ''} con SKU ${item.sku}.`,
      date: item.createdAt.toISOString(),
      performedBy: 'Sistema / Administrador IT',
      meta: { sku: item.sku, model: item.model, serialNumber: item.serialNumber }
    });

    // 2. Transactions
    item.transactions.forEach((tx) => {
      let title = 'Movimiento de Inventario';
      if (tx.type === 'INBOUND') title = `Entrada de Stock (+${tx.quantity})`;
      else if (tx.type === 'OUTBOUND') title = `Salida de Stock (-${tx.quantity})`;
      else if (tx.type === 'TRANSFER') title = `Transferencia entre Plantas (${tx.fromPlant || 'Origen'} ➔ ${tx.toPlant || 'Destino'})`;
      else if (tx.type === 'EDIT') title = 'Modificación de Datos';
      else if (tx.type === 'DECOMMISSION') title = 'Baja de Activo / Enviado a Scrap';
      else if (tx.type === 'REACTIVATE') title = 'Reactivación de Activo';

      events.push({
        id: `tx-${tx.id}`,
        type: tx.type as any,
        title,
        description: tx.notes || (tx.assignedTo ? `Asignado a: ${tx.assignedTo}` : `Cantidad: ${tx.quantity}`),
        date: tx.createdAt.toISOString(),
        performedBy: tx.user?.name || tx.user?.username || 'Usuario',
        meta: { fromPlant: tx.fromPlant, toPlant: tx.toPlant, assignedTo: tx.assignedTo, quantity: tx.quantity }
      });
    });

    // 3. Responsivas (Assignments)
    item.responsivas.forEach((resp) => {
      events.push({
        id: `resp-${resp.id}`,
        type: 'RESPONSIVA',
        title: `Responsiva Firmada - Asignación a ${resp.colaborador}`,
        description: `Equipo entregado en custodia a ${resp.colaborador}. Serie: ${resp.serie}. ${resp.observaciones ? `Observaciones: ${resp.observaciones}` : ''}`,
        date: resp.createdAt.toISOString(),
        performedBy: 'Departamento IT',
        meta: { colaborador: resp.colaborador, emailSent: resp.emailSent, responsivaId: resp.id }
      });
    });

    // 4. Maintenances
    item.maintenances.forEach((m) => {
      events.push({
        id: `maint-${m.id}`,
        type: 'MAINTENANCE',
        title: `Mantenimiento Preventivo (${m.deviceType})`,
        description: `Servicio técnico completado. Próximo mantenimiento programado para: ${new Date(m.nextDueDate).toLocaleDateString('es-MX')}. ${m.notes ? `Notas: ${m.notes}` : ''}`,
        date: m.performedAt.toISOString(),
        performedBy: m.performedBy,
        meta: { nextDueDate: m.nextDueDate, checklist: m.checklist }
      });
    });

    // Sort all events in descending chronological order
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json({ item, events });
  } catch (error: any) {
    console.error('Error al obtener la línea de tiempo del artículo:', error);
    return res.status(500).json({ error: 'Error al consultar la línea de tiempo.' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;
    if (!isSuperAdmin && existing.plant !== req.user?.plant) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar artículos de otras plantas.' });
    }

    // Safety rule: Items must be in SCRAP / DECOMMISSIONED state before being permanently purged
    if (existing.status !== 'DECOMMISSIONED') {
      return res.status(400).json({
        error: 'Para eliminar permanentemente un activo de la base de datos, primero debe enviarse al apartado de Bajas / Scrap.'
      });
    }

    // Delete associated dependencies if necessary or delete item
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { itemId: id } }),
      prisma.maintenance.deleteMany({ where: { itemId: id } }),
      prisma.responsivaHistory.deleteMany({ where: { itemId: id } }),
      prisma.deviceLoan.deleteMany({ where: { itemId: id } }),
      prisma.item.delete({ where: { id } })
    ]);

    return res.json({ message: 'Artículo y su historial eliminados permanentemente de la base de datos' });
  } catch (error: any) {
    console.error('Error al eliminar artículo permanentemente:', error);
    return res.status(500).json({ error: 'Error al eliminar el artículo de la base de datos' });
  }
});

export default router;
