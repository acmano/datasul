// src/shared/middlewares/apiKeyAuth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '@shared/services/ApiKeyService';
import { AuthenticationError } from '@shared/errors';
import { log } from '@shared/utils/logger';

/**
 * Middleware de autenticação por API Key
 * 
 * Aceita API Key via:
 * - Header: X-API-Key
 * - Header: Authorization: Bearer <api-key>
 * - Query: ?api_key=<api-key>
 */
export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extrai API Key de múltiplas fontes
    const apiKey = extractApiKey(req);

    if (!apiKey) {
      throw new AuthenticationError('API Key não fornecida. Forneça via header X-API-Key ou Authorization: Bearer <key>');
    }

    // Valida API Key
    const keyConfig = await ApiKeyService.validateKey(apiKey);

    if (!keyConfig) {
      throw new AuthenticationError(`API Key inválida ou expirada: ${maskApiKey(apiKey)}`);
    }

    // Adiciona informações do usuário ao request
    req.apiKey = keyConfig;
    req.user = {
      id: keyConfig.userId,
      name: keyConfig.userName,
      tier: keyConfig.tier
    };

    log.debug('Autenticação via API Key', {
      correlationId: req.id,
      userId: keyConfig.userId,
      tier: keyConfig.tier,
      apiKey: maskApiKey(apiKey)
    });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware de autenticação opcional
 * Se API Key fornecida, valida. Se não, continua sem autenticação.
 */
export async function optionalApiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    // Sem API Key, continua sem autenticação
    return next();
  }

  try {
    const keyConfig = await ApiKeyService.validateKey(apiKey);

    if (keyConfig) {
      req.apiKey = keyConfig;
      req.user = {
        id: keyConfig.userId,
        name: keyConfig.userName,
        tier: keyConfig.tier
      };

      log.debug('Autenticação opcional via API Key', {
        correlationId: req.id,
        userId: keyConfig.userId,
        tier: keyConfig.tier
      });
    }

    next();
  } catch (error) {
    // Ignora erros de autenticação no modo opcional
    next();
  }
}

/**
 * Extrai API Key do request
 */
function extractApiKey(req: Request): string | null {
  // 1. Header X-API-Key
  const headerKey = req.headers['x-api-key'] as string;
  if (headerKey) {
    return headerKey;
  }

  // 2. Header Authorization: Bearer
  const authHeader = req.headers['authorization'] as string;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 3. Query parameter
  const queryKey = req.query.api_key as string;
  if (queryKey) {
    return queryKey;
  }

  return null;
}

/**
 * Mascara API Key para logs
 */
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '***';
  }
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}