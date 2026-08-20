import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { prisma } from '../utils/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Rate limit: max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de acceso. Por favor espere 15 minutos antes de intentar nuevamente.' },
  skipSuccessfulRequests: true
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.username || req.body.email;
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return res.status(400).json({ error: 'Por favor, ingrese usuario/correo y contraseña' });
    }

    const identifier = String(rawIdentifier).trim();

    // Search by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('FATAL: JWT_SECRET no configurado. El servidor no puede firmar tokens de autenticación.');
      return res.status(500).json({ error: 'Error de configuración interna del servidor' });
    }

    // Single active session enforcement: generate new unique session ID
    const sessionId = uuidv4();
    await prisma.user.update({
      where: { id: user.id },
      data: { currentSessionId: sessionId }
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        plant: user.plant ?? null,
        sessionId
      },
      secret,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        plant: user.plant ?? null
      }
    });
  } catch (error: any) {
    console.error('Error en /login:', error);
    return res.status(500).json({ error: 'Error interno del servidor al autenticar' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, username: true, name: true, role: true, plant: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ user });
  } catch (error: any) {
    console.error('Error en /me:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/verify-master - Verify password or master key before unlocking sensitive data
router.post('/verify-master', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Debe ingresar una contraseña válida' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // 1. Check if it matches the current user's password
    const isUserPasswordValid = await bcrypt.compare(password, user.password);

    // 2. Check if it matches configured master security key
    const masterKey = process.env.MASTER_SECURITY_KEY || 'master123';
    const isMasterKeyValid = password === masterKey;

    if (!isUserPasswordValid && !isMasterKeyValid) {
      return res.status(401).json({ error: 'Contraseña de autorización incorrecta' });
    }

    return res.json({
      success: true,
      message: 'Identidad y permisos verificados exitosamente',
      verifiedBy: user.name || user.username
    });
  } catch (error: any) {
    console.error('Error en /verify-master:', error);
    return res.status(500).json({ error: 'Error al verificar credenciales' });
  }
});

export default router;
