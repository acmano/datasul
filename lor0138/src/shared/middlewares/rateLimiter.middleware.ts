// src/shared/middlewares/rateLimiter.middleware.ts

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter geral para toda a API
 * 100 requisições por 15 minutos por IP
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
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Limite de requisições excedido. Aguarde alguns minutos.',
    });
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development' &&
      process.env.SKIP_RATE_LIMIT === 'true';
  },
});

/**
 * Rate limiter mais restritivo para endpoints críticos
 * 20 requisições por 5 minutos por IP
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
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Limite de requisições excedido para este endpoint.',
    });
  },
});

/**
 * Rate limiter por item específico
 * Previne consultas repetidas do mesmo item
 * 10 requisições do mesmo item por minuto
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
  keyGenerator: (req) => {
    // Combina IP padrão com itemCodigo
    const itemCodigo = req.params.itemCodigo || 'no-item';
    return `item:${itemCodigo}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Muitas consultas para este item específico. Aguarde um momento.',
    });
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development' &&
      process.env.SKIP_RATE_LIMIT === 'true';
  },
});