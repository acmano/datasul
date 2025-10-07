// src/shared/middlewares/apiKeyAuth.middleware.ts

/**
 * Middleware de autenticação por API Key
 *
 * @module shared/middlewares/apiKeyAuth
 * @see apiKeyAuth.middleware.md para documentação completa
 *
 * Exports:
 * - apiKeyAuth: Middleware obrigatório (bloqueia sem API Key)
 * - optionalApiKeyAuth: Middleware opcional (permite sem API Key)
 *
 * Fontes suportadas:
 * 1. Header X-API-Key
 * 2. Header Authorization: Bearer
 * 3. Query parameter api_key
 */

import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '@shared/services/apiKey.service';
import { AuthenticationError } from '@shared/errors/errors';
import { log } from '@shared/utils/logger';

/**
 * Middleware de autenticação obrigatória por API Key
 *
 * @throws {AuthenticationError} Se API Key não fornecida ou inválida
 */
export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = extractApiKey(req);

    if (!apiKey) {
      throw new AuthenticationError(
        'API Key não fornecida. Forneça via header X-API-Key ou Authorization: Bearer <key>'
      );
    }

    const keyConfig = await ApiKeyService.validateKey(apiKey);

    if (!keyConfig) {
      throw new AuthenticationError(
        `API Key inválida ou expirada: ${maskApiKey(apiKey)}`
      );
    }

    // Adiciona informações ao request
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
 * Middleware de autenticação opcional por API Key
 *
 * Não bloqueia se API Key não fornecida.
 * Ignora erros de validação silenciosamente.
 */
export async function optionalApiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
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
    // Ignora erros no modo opcional
    next();
  }
}

/**
 * Extrai API Key do request
 * Ordem: X-API-Key → Authorization Bearer → Query api_key
 */
function extractApiKey(req: Request): string | null {
  // 1. Header X-API-Key
  const headerKey = req.headers['x-api-key'] as string;
  if (headerKey) return headerKey;

  // 2. Header Authorization: Bearer
  const authHeader = req.headers['authorization'] as string;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 3. Query parameter
  const queryKey = req.query.api_key as string;
  if (queryKey) return queryKey;

  return null;
}

/**
 * Mascara API Key para logs
 * Mostra primeiros e últimos 4 caracteres
 */
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '***';
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}