import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

// Valid roles in the system
export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN_PLANTA: 'ADMIN_PLANTA',
  OPERATOR: 'OPERATOR',
  AUDITOR: 'AUDITOR',
  USER: 'USER',
  ADMIN: 'ADMIN', // Legacy role
} as const;

export type UserRole = keyof typeof ROLES;

// Valid plants
export const PLANTS = ['Planta 1', 'Planta 2', 'Planta 3', 'Planta UPCAST'] as const;
export type PlantName = typeof PLANTS[number];

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    name?: string;
    role: string;
    plant?: string | null;
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

    // Single active concurrent session enforcement
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

// ----- Role-based Middleware -----

/** Require that the user has at least one of the given roles */
export const requireRole = (...roles: string[]) => (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Acceso denegado: Se requiere uno de los siguientes roles: ${roles.join(', ')}`
    });
  }
  next();
};

/** Shortcut: only ADMIN_PLANTA, SUPERADMIN or legacy ADMIN */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => requireRole(ROLES.ADMIN_PLANTA, ROLES.SUPERADMIN, ROLES.ADMIN)(req, res, next);

/** Shortcut: only SUPERADMIN */
export const requireSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => requireRole(ROLES.SUPERADMIN)(req, res, next);

/**
 * Enforce plant scope on item queries.
 * - SUPERADMIN: no restriction, can optionally filter by plant query param.
 * - Everyone else: results are scoped to their assigned plant.
 * Injects req.plantFilter which downstream routes can use.
 */
export const enforcePlantScope = (
  req: AuthenticatedRequest & { plantFilter?: string | null },
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (req.user.role === ROLES.SUPERADMIN) {
    // SUPERADMIN can pass ?plant= to filter, or gets all plants
    req.plantFilter = (req.query.plant as string) || null;
  } else {
    // Everyone else is locked to their plant
    if (!req.user.plant) {
      return res.status(403).json({
        error: 'Tu cuenta no tiene planta asignada. Contacta al administrador del sistema.'
      });
    }
    req.plantFilter = req.user.plant;
  }
  next();
};

/**
 * Custody rule enforcement for item edits.
 * If the item's plant !== its originPlant, the receiving plant
 * can only update a whitelist of "soft" fields.
 * Downstream: attach this middleware to PUT /api/items/:id
 */
export const CUSTODY_PROTECTED_FIELDS = [
  'sku', 'serialNumber', 'model', 'originPlant', 'hasWarranty',
  'warrantyExpiration', 'category', 'isITInternal', 'bitlockerKey'
] as const;
