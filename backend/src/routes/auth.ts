import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Por favor, ingrese usuario/correo y contraseña' });
    }

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
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
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
        role: user.role
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
      select: { id: true, email: true, username: true, name: true, role: true, createdAt: true }
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

export default router;
