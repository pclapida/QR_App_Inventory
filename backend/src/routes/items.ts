import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { prisma } from '../utils/prisma';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

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
  const text = `${name || ''} ${sku || ''} ${model || ''}`.toLowerCase();
  if (text.includes('cofmx')) return 'Planta 1';
  if (text.includes('cofdg')) return 'Planta 2';
  if (text.includes('cofud')) return 'Planta UPCAST';
  if (text.includes('cofd3')) return 'Planta 3';
  return defaultPlant;
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

      const existingSku = await prisma.item.findUnique({ where: { sku: finalSku } });
      if (existingSku) {
        finalSku = `${finalSku}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const qrCodePayload = `INV-${newItemId}`;

      try {
        await prisma.item.create({
          data: {
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
            location: area || null,
            plant: determinePlant(name, finalSku, model, 'Planta 2'),
            qrCodePayload
          }
        });
        successCount++;
      } catch (err: any) {
        console.error(`Error al insertar fila ${index + 2}:`, err);
        errors.push(`Fila ${index + 2} (${name}): ${err.message}`);
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

// GET /api/items - List all items with optional pagination and filters
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, category, plant, isITInternal, page, limit } = req.query;
    const whereClause: any = {};

    if (isITInternal !== undefined && isITInternal !== '') {
      whereClause.isITInternal = isITInternal === 'true' || isITInternal === '1';
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
        { name: { contains: query } },
        { sku: { contains: query } },
        { model: { contains: query } },
        { serialNumber: { contains: query } },
        { area: { contains: query } },
        { location: { contains: query } },
        { assignedTo: { contains: query } },
        { plant: { contains: query } },
        { ipAddress: { contains: query } },
        { notes: { contains: query } },
        { faults: { contains: query } },
        { customAttributes: { contains: query } },
        { qrCodePayload: { contains: query } },
        { id: { contains: query } }
      ];
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

    return res.json({
      items,
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
      customAttributes
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
    const isIT = typeof isITInternal === 'boolean' ? isITInternal : (isITInternal === 'true' || isITInternal === '1');

    let customAttrStr: string | null = null;
    if (customAttributes) {
      customAttrStr = typeof customAttributes === 'string' ? customAttributes : JSON.stringify(customAttributes);
    }

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
        plant: determinePlant(name.trim(), finalSku, model ? model.trim() : '', plant ? plant.trim() : 'Planta 2'),
        isITInternal: isIT,
        assignedTo: assignedTo ? assignedTo.trim() : null,
        customAttributes: customAttrStr,
        stock: typeof stock === 'number' ? stock : parseInt(stock || '1', 10),
        minStock: typeof minStock === 'number' ? minStock : parseInt(minStock || '1', 10),
        unit: unit ? unit.trim() : 'unidad',
        location: location ? location.trim() : (isIT ? 'Taller Interno IT' : (area ? area.trim() : null)),
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
        notes: `Alta de producto registrada en ${item.plant}`
      }
    });

    return res.status(201).json({ item });
  } catch (error: any) {
    console.error('Error al crear artículo:', error);
    return res.status(500).json({ error: 'Error al registrar el nuevo artículo' });
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

    const fromPlant = existing.plant;
    const newPlant = targetPlant.trim();

    if (fromPlant === newPlant) {
      return res.status(400).json({ error: `El artículo ya se encuentra en ${newPlant}` });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        plant: newPlant,
        location: existing.area ? `${existing.area} (${newPlant})` : newPlant
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

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedSku = sku !== undefined ? sku.trim().toUpperCase() : existing.sku;
    const updatedModel = model !== undefined ? model : existing.model;
    const explicitPlant = plant !== undefined ? plant.trim() : existing.plant;
    const newPlant = determinePlant(updatedName, updatedSku, updatedModel || '', explicitPlant);
    const plantChanged = newPlant !== existing.plant;

    let customAttrStr = existing.customAttributes;
    if (customAttributes !== undefined) {
      customAttrStr = customAttributes ? (typeof customAttributes === 'string' ? customAttributes : JSON.stringify(customAttributes)) : null;
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        model: model !== undefined ? model : existing.model,
        serialNumber: serialNumber !== undefined ? serialNumber : existing.serialNumber,
        notes: notes !== undefined ? notes : existing.notes,
        faults: faults !== undefined ? faults : existing.faults,
        area: area !== undefined ? area : existing.area,
        ipAddress: ipAddress !== undefined ? ipAddress : existing.ipAddress,
        sku: sku !== undefined ? sku.trim().toUpperCase() : existing.sku,
        hasWarranty: hasWarranty !== undefined ? Boolean(hasWarranty) : existing.hasWarranty,
        warrantyExpiration: warrantyExpiration !== undefined ? warrantyExpiration : existing.warrantyExpiration,
        description: description !== undefined ? description : existing.description,
        category: category !== undefined ? determineCategory(updatedName, updatedModel || '', category) : determineCategory(updatedName, updatedModel || '', existing.category || 'Equipos & Dispositivos'),
        plant: newPlant,
        isITInternal: isITInternal !== undefined ? Boolean(isITInternal) : existing.isITInternal,
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

// DELETE /api/items/:id
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    await prisma.item.delete({ where: { id } });
    return res.json({ message: 'Artículo eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar artículo:', error);
    return res.status(500).json({ error: 'Error al eliminar el artículo' });
  }
});

export default router;
