// src/shared/middlewares/metrics.middleware.ts

/**
 * Middleware para coleta automática de métricas HTTP (Prometheus)
 *
 * @module shared/middlewares/metrics
 * @see metrics.middleware.md para documentação completa
 *
 * Métricas coletadas:
 * - httpRequestsTotal: Total de requisições (counter)
 * - httpRequestDuration: Duração das requisições (histogram)
 * - httpRequestsInProgress: Requisições em progresso (gauge)
 * - rateLimitRequestsBlocked: Bloqueios por rate limit (counter)
 * - rateLimitRequestsAllowed: Requisições permitidas (counter)
 *
 * Exports:
 * - metricsMiddleware: Coleta métricas HTTP principais
 * - rateLimitMetricsMiddleware: Métricas de rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import { metricsManager } from '@infrastructure/metrics/MetricsManager';

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

/**
 * Middleware de coleta automática de métricas HTTP
 *
 * IMPORTANTE:
 * - Registrar logo após correlationIdMiddleware
 * - Registrar ANTES das rotas
 * - Ignora endpoint /metrics (previne loop)
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Ignora endpoint de métricas (previne loop)
  if (req.path === '/metrics') {
    return next();
  }

  // Captura timestamp inicial
  const startTime = Date.now();
  const method = req.method;
  const route = normalizeRoute(req.path);

  // Incrementa requisições em progresso
  metricsManager.httpRequestsInProgress.inc({ method, route });

  // Registra quando resposta é finalizada
  res.on('finish', () => {
    // Duração em segundos (padrão Prometheus)
    const duration = (Date.now() - startTime) / 1000;
    const statusCode = res.statusCode.toString();

    // Decrementa requisições em progresso
    metricsManager.httpRequestsInProgress.dec({ method, route });

    // Incrementa total de requisições
    metricsManager.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    // Registra duração
    metricsManager.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode,
      },
      duration
    );
  });

  next();
}

// ============================================================================
// NORMALIZAÇÃO DE ROTAS
// ============================================================================

/**
 * Normaliza rotas para evitar cardinalidade alta
 *
 * Substitui valores dinâmicos (IDs, UUIDs) por placeholders
 * para agrupar métricas eficientemente.
 *
 * @param path - Caminho da requisição
 * @returns Rota normalizada
 *
 * @example
 * '/api/item/7530110' → '/api/item/:itemCodigo'
 * '/api/user/550e8400-...' → '/api/user/:uuid'
 */
function normalizeRoute(path: string): string {
  // Remove query strings
  path = path.split('?')[0];

  const patterns = [
    // Item codes específicos
    {
      regex: /\/api\/lor0138\/item\/dadosCadastrais\/informacoesGerais\/[^\/]+$/,
      replacement: '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo',
    },

    // UUIDs
    {
      regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      replacement: ':uuid',
    },

    // IDs numéricos no final
    {
      regex: /\/\d+$/,
      replacement: '/:id',
    },
  ];

  // Aplica primeiro padrão que matchou
  for (const pattern of patterns) {
    if (pattern.regex.test(path)) {
      return path.replace(pattern.regex, pattern.replacement);
    }
  }

  return path;
}

// ============================================================================
// MÉTRICAS DE RATE LIMITING
// ============================================================================

/**
 * Middleware para métricas de rate limiting
 *
 * IMPORTANTE:
 * - Usar APÓS o rate limiter
 * - Status 429 indica bloqueio
 */
export function rateLimitMetricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const route = normalizeRoute(req.path);
  const userId = (req as any).userId || 'anonymous';

  // Status 429 = Too Many Requests
  if (res.statusCode === 429) {
    metricsManager.rateLimitRequestsBlocked.inc({
      route,
      user_id: userId,
      reason: 'rate_limit_exceeded',
    });
  } else {
    metricsManager.rateLimitRequestsAllowed.inc({
      route,
      user_id: userId,
    });
  }

  next();
}