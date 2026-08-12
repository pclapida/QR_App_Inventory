import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Obtener todo el historial de responsivas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.responsivaHistory.findMany({
      include: {
        item: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(history);
  } catch (error) {
    console.error('Error fetching responsiva history:', error);
    res.status(500).json({ error: 'Error al obtener el historial de responsivas' });
  }
});

// Guardar una nueva responsiva en el historial
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      itemId,
      colaborador,
      marcaModelo,
      serie,
      nombreEquipo,
      accesorios, // We will JSON.stringify this
      observaciones,
      photoUrls // We will JSON.stringify this
    } = req.body;

    const newHistory = await prisma.responsivaHistory.create({
      data: {
        itemId,
        colaborador,
        marcaModelo,
        serie,
        nombreEquipo,
        accesoriosJson: JSON.stringify(accesorios),
        observaciones: observaciones || '',
        photoUrlsJson: JSON.stringify(photoUrls || []),
      }
    });

    res.status(201).json(newHistory);
  } catch (error) {
    console.error('Error saving responsiva:', error);
    res.status(500).json({ error: 'Error al guardar la responsiva en el historial' });
  }
});

export default router;
