// src/shared/middlewares/compression.middleware.ts

/**
 * Middleware de compressão de respostas HTTP (gzip/deflate/brotli)
 *
 * @module shared/middlewares/compression
 * @see compression.middleware.md para documentação completa
 *
 * Exports:
 * - compressionMiddleware: Configuração balanceada (padrão)
 * - aggressiveCompression: Máxima compressão (mais CPU)
 * - lightCompression: Mínima CPU (menos compressão)
 * - createCustomCompression: Factory para config customizada
 * - noCompression: Desabilita compressão para rota
 *
 * Benefícios:
 * - Reduz bandwidth em até 80%
 * - Respostas mais rápidas
 * - Suporta gzip/deflate/brotli
 */

import compression from 'compression';
import { Request, Response, NextFunction } from 'express';

// ====================================================================
// FUNÇÃO DE FILTRO
// ====================================================================

/**
 * Determina se deve comprimir a resposta
 * Verifica Content-Encoding existente e Accept-Encoding do cliente
 */
function shouldCompress(req: Request, res: Response): boolean {
  // Não comprime se já tem Content-Encoding
  if (res.getHeader('Content-Encoding')) {
    return false;
  }

  // Não comprime se cliente não suporta
  if (!req.headers['accept-encoding']) {
    return false;
  }

  // Usa função padrão do compression
  return compression.filter(req, res);
}

// ====================================================================
// MIDDLEWARES
// ====================================================================

/**
 * Middleware de compressão balanceado (RECOMENDADO)
 * Level: 6, Threshold: 1KB, MemLevel: 8
 * CPU: +5%, Compressão: ~75%
 */
export const compressionMiddleware = compression({
  filter: shouldCompress,
  level: 6, // Bom equilíbrio
  threshold: 1024, // Comprime a partir de 1KB
  memLevel: 8, // Buffer de ~256KB
  strategy: 0, // Estratégia padrão
});

/**
 * Middleware de compressão agressiva
 * Level: 9, Threshold: 512 bytes, MemLevel: 9
 * CPU: +15%, Compressão: ~85%
 * Use quando bandwidth é mais crítico que CPU
 */
export const aggressiveCompression = compression({
  filter: shouldCompress,
  level: 9, // Máxima compressão
  threshold: 512, // Comprime mais coisas
  memLevel: 9, // Mais memória
});

/**
 * Middleware de compressão leve
 * Level: 1, Threshold: 2KB, MemLevel: 6
 * CPU: +2%, Compressão: ~60%
 * Use quando CPU é limitada ou latência é crítica
 */
export const lightCompression = compression({
  filter: shouldCompress,
  level: 1, // Compressão rápida
  threshold: 2048, // Apenas respostas > 2KB
  memLevel: 6, // Menos memória
});

// ====================================================================
// UTILITÁRIOS
// ====================================================================

/**
 * Cria middleware de compressão customizado
 * @param options - Configuração (level, threshold, memLevel, strategy, filter)
 */
export function createCustomCompression(options: {
  level?: number;
  threshold?: number;
  memLevel?: number;
  strategy?: number;
  filter?: (req: Request, res: Response) => boolean;
}) {
  return compression({
    filter: options.filter || shouldCompress,
    level: options.level ?? 6,
    threshold: options.threshold ?? 1024,
    memLevel: options.memLevel ?? 8,
    strategy: options.strategy ?? 0,
  });
}

/**
 * Desabilita compressão para rota específica
 * Útil para arquivos já comprimidos (.zip, .gz, etc)
 */
export function noCompression(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-transform');
  next();
}
