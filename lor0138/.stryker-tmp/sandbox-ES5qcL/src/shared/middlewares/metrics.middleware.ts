// @ts-nocheck
// src/shared/middlewares/metricsMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { metricsManager } from '@infrastructure/metrics/MetricsManager';

/**
 * Middleware para coletar métricas de todas as requisições HTTP
 * 
 * Coleta:
 * - Total de requisições
 * - Duração das requisições
 * - Status codes
 * - Requisições em progresso
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Ignora endpoint de métricas para não criar loop
  if (req.path === '/metrics') {
    return next();
  }

  const startTime = Date.now();
  const method = req.method;
  
  // Normaliza a rota para agrupar métricas
  // Ex: /api/lor0138/item/dadosCadastrais/informacoesGerais/7530110
  //  -> /api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo
  const route = normalizeRoute(req.path);

  // Incrementa contador de requisições em progresso
  metricsManager.httpRequestsInProgress.inc({ method, route });

  // Captura quando a resposta é finalizada
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000; // segundos
    const statusCode = res.statusCode.toString();

    // Decrementa requisições em progresso
    metricsManager.httpRequestsInProgress.dec({ method, route });

    // Incrementa total de requisições
    metricsManager.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    // Registra duração da requisição
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

/**
 * Normaliza a rota para agrupar métricas
 * Remove IDs específicos e mantém a estrutura da rota
 */
function normalizeRoute(path: string): string {
  // Remove query strings
  path = path.split('?')[0];

  // Padrões comuns para substituir por placeholders
  const patterns = [
    // Item codes (números ou códigos alfanuméricos)
    {
      regex: /\/api\/lor0138\/item\/dadosCadastrais\/informacoesGerais\/[^\/]+$/,
      replacement: '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo',
    },
    // UUIDs
    {
      regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      replacement: ':uuid',
    },
    // Números genéricos no final da URL
    {
      regex: /\/\d+$/,
      replacement: '/:id',
    },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(path)) {
      return path.replace(pattern.regex, pattern.replacement);
    }
  }

  return path;
}

/**
 * Middleware para coletar métricas de rate limiting
 * Deve ser usado APÓS o rate limiter
 */
export function rateLimitMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const route = normalizeRoute(req.path);
  const userId = (req as any).userId || 'anonymous';

  // Se a requisição foi bloqueada pelo rate limiter
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