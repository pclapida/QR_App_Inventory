import express from 'express';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// ─── Nodemailer transporter ───────────────────────────────────────────────────
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
};

// ─── GET /api/responsivas — Historial completo ────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.responsivaHistory.findMany({
      include: { item: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    console.error('Error fetching responsiva history:', error);
    res.status(500).json({ error: 'Error al obtener el historial de responsivas' });
  }
});

// ─── POST /api/responsivas — Guardar nueva responsiva ────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      itemId,
      colaborador,
      marcaModelo,
      serie,
      nombreEquipo,
      accesorios,
      observaciones,
      photoUrls,
      email
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
        email: email || null,
        emailSent: false
      }
    });

    res.status(201).json(newHistory);
  } catch (error) {
    console.error('Error saving responsiva:', error);
    res.status(500).json({ error: 'Error al guardar la responsiva en el historial' });
  }
});

// ─── POST /api/responsivas/send-email — Enviar responsiva por correo ─────────
router.post('/send-email', authenticateToken, async (req, res) => {
  try {
    const { responsivaId, htmlContent, toEmail, colaborador, nombreEquipo } = req.body;

    if (!toEmail || !htmlContent) {
      return res.status(400).json({ error: 'Se requiere el correo destino y el contenido HTML.' });
    }

    const transporter = createTransporter();
    if (!transporter) {
      return res.status(503).json({
        error: 'El servidor de correo no está configurado. Contacta al administrador para configurar las variables SMTP_HOST, SMTP_USER y SMTP_PASS en el servidor.'
      });
    }

    const fromName = process.env.SMTP_FROM || 'IT COFICAB <ti@coficab.com>';

    await transporter.sendMail({
      from: fromName,
      to: toEmail,
      subject: `Carta Responsiva - Entrega de Equipo: ${nombreEquipo || 'Equipo IT'}`,
      html: `
        <p>Estimado/a <strong>${colaborador || 'Colaborador'}</strong>,</p>
        <p>Adjunto encontrará su <strong>Carta Responsiva</strong> de entrega de equipo IT por parte del departamento de Tecnología de COFICAB.</p>
        <p>Por favor conserve este documento. Si tiene alguna pregunta, no dude en contactarnos.</p>
        <hr>
        ${htmlContent}
        <hr>
        <p style="font-size:12px;color:#999;">Este correo fue generado automáticamente por el sistema de inventario COFICAB IT.</p>
      `
    });

    // Update emailSent flag in DB if we have the ID
    if (responsivaId) {
      await prisma.responsivaHistory.update({
        where: { id: responsivaId },
        data: { emailSent: true }
      }).catch(() => {/* non-critical */});
    }

    res.json({ success: true, message: `Correo enviado exitosamente a ${toEmail}` });
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: `Error al enviar el correo: ${error?.message || 'Error desconocido'}`
    });
  }
});

export default router;
