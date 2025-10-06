// src/shared/middlewares/rateLimiter.middleware.ts

/**
 * @fileoverview Middlewares de Rate Limiting
 *
 * @description
 * Implementa diferentes estratégias de rate limiting para proteger a API
 * contra abuso e garantir disponibilidade do serviço. Suporta limitação
 * por IP, por endpoint e por recurso específico.
 *
 * TIPOS DE RATE LIMITERS:
 * - apiLimiter: Rate limiting geral para toda a API
 * - strictLimiter: Rate limiting restritivo para endpoints críticos
 * - itemLimiter: Rate limiting por recurso específico (item)
 *
 * @module shared/middlewares/rateLimiter
 *
 * @requires express-rate-limit
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// ====================================================================
// RATE LIMITER GERAL
// ====================================================================

/**
 * Rate limiter geral para toda a API
 *
 * @description
 * Middleware de rate limiting baseado em IP para proteger toda a API
 * contra requisições excessivas. Aplica limite de 100 requisições
 * por janela de 15 minutos.
 *
 * @constant
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 *
 * @example
 * ```typescript
 * // No app.ts ou rotas
 * import { apiLimiter } from '@shared/middlewares/rateLimiter.middleware';
 *
 * app.use('/api', apiLimiter);
 * ```
 *
 * CONFIGURAÇÃO:
 * - Window: 15 minutos (900.000ms)
 * - Limite: 100 requisições por IP
 * - Headers: RateLimit-* (padrão RFC)
 * - Status: 429 (Too Many Requests)
 *
 * AMBIENTE DE DESENVOLVIMENTO:
 * - Skip automático se NODE_ENV=development e SKIP_RATE_LIMIT=true
 *
 * HEADERS DE RESPOSTA:
 * - RateLimit-Limit: Número máximo de requisições permitidas
 * - RateLimit-Remaining: Número de requisições restantes
 * - RateLimit-Reset: Timestamp Unix quando o limite reseta
 *
 * @remarks
 * - Identifica cliente por IP (req.ip)
 * - Suporta IPv4 e IPv6 automaticamente
 * - Usa armazenamento em memória (não distribuído)
 * - Para ambientes com múltiplos servidores, considere Redis
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de requisições
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
  standardHeaders: true, // Retorna info no header `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Limite de requisições excedido. Aguarde alguns minutos.',
    });
  },
  skip: (req: Request) => {
    return (
      process.env.NODE_ENV === 'development' &&
      process.env.SKIP_RATE_LIMIT === 'true'
    );
  },
});

// ====================================================================
// RATE LIMITER RESTRITIVO
// ====================================================================

/**
 * Rate limiter restritivo para endpoints críticos
 *
 * @description
 * Middleware de rate limiting mais agressivo para proteger endpoints
 * críticos ou custosos (queries complexas, operações de escrita, etc).
 * Aplica limite de 20 requisições por janela de 5 minutos.
 *
 * @constant
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 *
 * @example
 * ```typescript
 * // Em rotas específicas
 * import { strictLimiter } from '@shared/middlewares/rateLimiter.middleware';
 *
 * // Proteger endpoint de relatório complexo
 * router.get('/relatorios/complexo', strictLimiter, controller.getRelatorioComplexo);
 *
 * // Proteger endpoint de escrita
 * router.post('/items', strictLimiter, controller.createItem);
 * ```
 *
 * CONFIGURAÇÃO:
 * - Window: 5 minutos (300.000ms)
 * - Limite: 20 requisições por IP
 * - Headers: RateLimit-* (padrão RFC)
 * - Status: 429 (Too Many Requests)
 *
 * CASOS DE USO:
 * - Endpoints de relatórios pesados
 * - Operações de escrita (POST, PUT, DELETE)
 * - Queries complexas com múltiplos JOINs
 * - Endpoints que disparam jobs assíncronos
 * - APIs de terceiros (proxies)
 *
 * @remarks
 * - NÃO tem skip em desenvolvimento (sempre ativo)
 * - Mais restritivo que apiLimiter
 * - Use com moderação para não prejudicar UX
 */
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20,
  message: {
    success: false,
    error: 'Muitas requisições neste endpoint. Aguarde alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Limite de requisições excedido para este endpoint.',
    });
  },
});

// ====================================================================
// RATE LIMITER POR RECURSO
// ====================================================================

/**
 * Rate limiter por recurso específico (item)
 *
 * @description
 * Middleware de rate limiting baseado em combinação de IP + recurso
 * para prevenir consultas repetidas do mesmo item. Aplica limite de
 * 10 requisições por item por minuto.
 *
 * @constant
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 *
 * @example
 * ```typescript
 * // Em rota de item
 * import { itemLimiter } from '@shared/middlewares/rateLimiter.middleware';
 *
 * router.get('/items/:itemCodigo', itemLimiter, controller.getItem);
 * ```
 *
 * CONFIGURAÇÃO:
 * - Window: 1 minuto (60.000ms)
 * - Limite: 10 requisições por item
 * - Key: `item:{itemCodigo}` (sem IP)
 * - Headers: RateLimit-* (padrão RFC)
 * - Status: 429 (Too Many Requests)
 *
 * KEY GENERATOR:
 * - Usa apenas itemCodigo (req.params.itemCodigo)
 * - Formato da chave: `item:{codigo}`
 * - Fallback: `item:no-item` se parâmetro não presente
 *
 * CASOS DE USO:
 * - Prevenir scraping de catálogo
 * - Limitar consultas repetidas do mesmo recurso
 * - Proteger cache de requisições excessivas
 *
 * AMBIENTE DE DESENVOLVIMENTO:
 * - Skip automático se NODE_ENV=development e SKIP_RATE_LIMIT=true
 *
 * @remarks
 * IMPORTANTE:
 * - A chave é baseada APENAS no itemCodigo
 * - NÃO considera IP (diferente de apiLimiter)
 * - Todos os clientes compartilham o mesmo limite por item
 * - Express-rate-limit já trata IPv6 internamente
 *
 * CUIDADOS:
 * - Use em conjunto com apiLimiter para dupla proteção
 * - Considere cache para itens muito consultados
 * - Monitore false positives (itens populares)
 */
export const itemLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10,
  message: {
    success: false,
    error: 'Muitas consultas para este item. Aguarde um momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Usa keyGenerator simples - o rate limiter já trata IPv6 internamente
  keyGenerator: (req: Request) => {
    // Combina IP padrão com itemCodigo
    const itemCodigo = req.params.itemCodigo || 'no-item';
    return `item:${itemCodigo}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Muitas consultas para este item específico. Aguarde um momento.',
    });
  },
  skip: (req: Request) => {
    return (
      process.env.NODE_ENV === 'development' &&
      process.env.SKIP_RATE_LIMIT === 'true'
    );
  },
});

// ====================================================================
// UTILITÁRIOS
// ====================================================================

/**
 * Cria rate limiter customizado com configurações específicas
 *
 * @description
 * Factory function para criar middlewares de rate limiting com
 * configurações personalizadas. Útil para casos específicos que
 * não se encaixam nos limiters padrão.
 *
 * @param {object} options - Opções de configuração
 * @param {number} options.windowMs - Janela de tempo em ms
 * @param {number} options.max - Número máximo de requisições
 * @param {string} [options.message] - Mensagem de erro customizada
 * @param {boolean} [options.skipInDev=false] - Skip em desenvolvimento
 * @param {Function} [options.keyGenerator] - Função para gerar chave customizada
 *
 * @returns {import('express-rate-limit').RateLimitRequestHandler} Middleware configurado
 *
 * @public
 *
 * @example
 * ```typescript
 * // Rate limiter customizado
 * const customLimiter = createCustomRateLimiter({
 *   windowMs: 60000,  // 1 minuto
 *   max: 5,           // 5 requisições
 *   message: 'Limite customizado excedido',
 *   skipInDev: true,
 *   keyGenerator: (req) => req.headers['x-user-id'] || req.ip
 * });
 *
 * router.post('/expensive-operation', customLimiter, controller.handle);
 * ```
 */
export function createCustomRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipInDev?: boolean;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: options.message || 'Rate limit excedido',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: options.message || 'Limite de requisições excedido',
      });
    },
    skip: options.skipInDev
      ? (req: Request) => {
        return (
          process.env.NODE_ENV === 'development' &&
          process.env.SKIP_RATE_LIMIT === 'true'
        );
      }
      : undefined,
  });
}