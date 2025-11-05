// src/shared/middlewares/cors.middleware.ts

/**
 * Middleware de CORS para rede interna
 *
 * @module shared/middlewares/cors
 * @see cors.middleware.md para documentação completa
 *
 * Origens permitidas:
 * - Domínios internos: *.lorenzetti.ibe, baseUrl do app
 * - IPs privados: 10.x.x.x (classe A)
 * - Localhost: 127.0.0.1, ::1
 * - Desenvolvimento: Configurável via CORS_ALLOW_ALL
 *
 * Exports:
 * - corsMiddleware: Middleware CORS configurado
 * - corsOriginValidator: Validador adicional (bloqueia não autorizados)
 */

import cors, { CorsOptions } from 'cors';
import { Request, Response, NextFunction } from 'express';
import { appConfig } from '@config/app.config';
import { log } from '@shared/utils/logger';

// ============================================================================
// VALIDAÇÃO DE ORIGEM
// ============================================================================

/**
 * Valida se a origem é permitida
 * Permite: domínios internos, IPs privados (10.x), localhost
 */
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    // Permite requisições sem origin (Postman, curl, mobile apps)
    return true;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // Domínios internos permitidos
    const allowedDomains = ['lorenzetti.ibe', appConfig.baseUrl];

    // Verifica domínios
    const isDomainAllowed = allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (isDomainAllowed) return true;

    // IPs privados classe A (10.x.x.x)
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    // Localhost
    if (hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// ============================================================================
// CONFIGURAÇÃO CORS
// ============================================================================

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Desenvolvimento: permite tudo se configurado
    if (process.env.NODE_ENV === 'development' && process.env.CORS_ALLOW_ALL === 'true') {
      callback(null, true);
      return;
    }

    // Valida origem
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400, // 24 horas
};

// ============================================================================
// MIDDLEWARES
// ============================================================================

/**
 * Middleware CORS principal
 */
export const corsMiddleware = cors(corsOptions);

/**
 * Validador adicional que bloqueia origens não autorizadas
 * Use após corsMiddleware para segurança extra
 */
export function corsOriginValidator(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  // Desenvolvimento: pula validação se configurado
  if (process.env.NODE_ENV === 'development' && process.env.CORS_ALLOW_ALL === 'true') {
    return next();
  }

  // Bloqueia origem não permitida
  if (origin && !isAllowedOrigin(origin)) {
    log.warn(`Requisição bloqueada - Origem não autorizada: ${origin}`);
    return res.status(403).json({
      success: false,
      error: 'Acesso negado - Origem não autorizada',
    });
  }

  next();
}
