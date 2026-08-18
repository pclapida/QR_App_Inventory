import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    name?: string;
    role: string;
    sessionId?: string;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado', code: 'NO_TOKEN' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Error de configuración interna del servidor' });
  }

  jwt.verify(token, secret, async (err, decoded: any) => {
    if (err || !decoded) {
      return res.status(401).json({ error: 'Sesión expirada o token inválido', code: 'INVALID_TOKEN' });
    }

    // Single active concurrent session enforcement:
    // If token has a sessionId, verify that it matches the user's latest active session in the database
    if (decoded.sessionId && decoded.id) {
      try {
        const userInDb = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { currentSessionId: true }
        });

        if (userInDb && userInDb.currentSessionId && userInDb.currentSessionId !== decoded.sessionId) {
          return res.status(401).json({
            error: 'Su sesión fue cerrada porque se inició sesión con esta misma cuenta en otro dispositivo o navegador.',
            code: 'CONCURRENT_SESSION_TERMINATED'
          });
        }
      } catch (dbErr) {
        console.error('Error verifying active session in DB:', dbErr);
      }
    }

    req.user = decoded as AuthenticatedRequest['user'];
    next();
  });
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de Administrador de IT para esta acción' });
  }
  next();
};
