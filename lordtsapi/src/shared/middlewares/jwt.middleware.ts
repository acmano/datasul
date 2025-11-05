/**
 * JWT Authentication Middleware
 */
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '@shared/errors/errors';

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  exp: number;
}

export async function jwtAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AuthenticationError('Token não fornecido');
    }

    // Implementar validação JWT
    const payload = await validateToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
      roles: payload.roles,
    };

    next();
  } catch (error) {
    next(error);
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function validateToken(token: string): Promise<JWTPayload> {
  // Implementar com jsonwebtoken
  throw new AuthenticationError('JWT validation not implemented');
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.roles?.includes(role)) {
      throw new AuthenticationError(`Requer role: ${role}`);
    }
    next();
  };
}
