// src/shared/middlewares/cors.middleware.ts

import cors, { CorsOptions } from 'cors';
import { Request, Response, NextFunction } from 'express';
import { appConfig } from '@config/app.config';

/**
 * Valida se a origem é da rede interna permitida
 */
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    // Permite requisições sem origin (ex: Postman, curl, apps mobile)
    return true;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // Lista de domínios internos permitidos
    const allowedDomains = [
      'lorenzetti.ibe',
      appConfig.baseUrl, // Desenvolvimento
    ];

    // Verifica se termina com algum domínio permitido
    const isDomainAllowed = allowedDomains.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (isDomainAllowed) {
      return true;
    }

    // Verifica range de IPs da rede privada classe A (10.x.x.x)
    const ipPattern = /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      return true;
    }

    // Verifica localhost IPs
    if (hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }

    return false;
  } catch (error) {
    // Origin inválida
    return false;
  }
}

/**
 * Configuração de CORS para rede interna
 */
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Em desenvolvimento, permite qualquer origem se configurado
    if (process.env.NODE_ENV === 'development' &&
      process.env.CORS_ALLOW_ALL === 'true') {
      callback(null, true);
      return;
    }

    // Valida origem
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      // Não retorna o header CORS para origens não autorizadas
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ],
  exposedHeaders: [
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
  ],
  maxAge: 86400,
};

/**
 * Middleware que bloqueia requisições de origens não autorizadas
 */
export function corsOriginValidator(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  // Em desenvolvimento com CORS_ALLOW_ALL, pula validação
  if (process.env.NODE_ENV === 'development' &&
    process.env.CORS_ALLOW_ALL === 'true') {
    return next();
  }

  // Se tem origin e não é permitida, bloqueia
  if (origin && !isAllowedOrigin(origin)) {
    console.warn(`Requisição bloqueada - Origem não autorizada: ${origin}`);
    return res.status(403).json({
      success: false,
      error: 'Acesso negado - Origem não autorizada',
    });
  }

  next();
}

// Exporta o middleware CORS padrão
export const corsMiddleware = cors(corsOptions);