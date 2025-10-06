// @ts-nocheck
// src/shared/middlewares/compression.middleware.ts

import compression from 'compression';
import { Request, Response } from 'express';

/**
 * Middleware de compressão de respostas
 * 
 * Comprime respostas usando gzip/deflate/brotli
 * Reduz drasticamente o tamanho de respostas JSON
 * 
 * Benefícios:
 * - Reduz bandwidth em até 80%
 * - Respostas mais rápidas
 * - Menor custo de transferência
 * - Melhor experiência do usuário
 */

/**
 * Função que decide se deve comprimir a resposta
 * Por padrão, comprime apenas se o cliente suportar
 */
function shouldCompress(req: Request, res: Response): boolean {
  // Se a resposta já tem Content-Encoding, não comprime
  if (res.getHeader('Content-Encoding')) {
    return false;
  }

  // Se o cliente não suporta compressão, não comprime
  if (!req.headers['accept-encoding']) {
    return false;
  }

  // Usa a função padrão do compression para decidir
  return compression.filter(req, res);
}

/**
 * Middleware de compressão configurado
 */
export const compressionMiddleware = compression({
  // Função que decide se comprime
  filter: shouldCompress,

  // Nível de compressão (0-9)
  // 6 é um bom equilíbrio entre velocidade e compressão
  level: 6,

  // Tamanho mínimo para comprimir (em bytes)
  // Respostas menores que 1KB não vale a pena comprimir
  threshold: 1024,

  // Tamanho do buffer de memória (16KB padrão)
  memLevel: 8,

  // Strategy de compressão
  // Z_DEFAULT_STRATEGY é bom para a maioria dos casos
  strategy: 0,
});

/**
 * Configuração alternativa para compressão agressiva
 * Use apenas se banda é mais importante que CPU
 */
export const aggressiveCompression = compression({
  filter: shouldCompress,
  level: 9, // Máxima compressão (mais CPU)
  threshold: 512, // Comprime a partir de 512 bytes
  memLevel: 9,
});