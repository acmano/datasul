// src/shared/middlewares/compression.middleware.ts

/**
 * @fileoverview Middleware de compressão de respostas HTTP
 *
 * @description
 * Implementa compressão automática de respostas usando gzip/deflate/brotli
 * para reduzir bandwidth e melhorar performance. Comprime respostas JSON,
 * HTML, CSS e JavaScript automaticamente.
 *
 * BENEFÍCIOS:
 * - Reduz bandwidth em até 80%
 * - Respostas mais rápidas para o cliente
 * - Menor custo de transferência de dados
 * - Melhor experiência em redes lentas
 * - Suporte automático a múltiplos algoritmos
 *
 * ALGORITMOS SUPORTADOS:
 * - gzip: Padrão, suportado por 99% dos navegadores
 * - deflate: Alternativa ao gzip
 * - brotli: Melhor compressão, navegadores modernos
 *
 * @module shared/middlewares/compression
 *
 * @requires compression
 *
 * @see {@link https://github.com/expressjs/compression}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding}
 */

import compression from 'compression';
import { Request, Response } from 'express';

// ====================================================================
// FUNÇÃO DE FILTRO
// ====================================================================

/**
 * Função que determina se deve comprimir a resposta
 *
 * @description
 * Avalia se a resposta deve ser comprimida baseado em vários critérios:
 * - Presença de Content-Encoding existente
 * - Suporte do cliente (Accept-Encoding header)
 * - Tipo de conteúdo da resposta
 * - Tamanho da resposta
 *
 * @param {Request} req - Objeto de requisição do Express
 * @param {Response} res - Objeto de resposta do Express
 * @returns {boolean} true se deve comprimir, false caso contrário
 *
 * @private
 *
 * CRITÉRIOS DE DECISÃO:
 *
 * 1. NÃO comprime se:
 *    - Resposta já tem Content-Encoding (já comprimida)
 *    - Cliente não suporta compressão (sem Accept-Encoding)
 *    - Tipo de conteúdo não deve ser comprimido (imagens, vídeos)
 *    - Resposta muito pequena (< threshold)
 *
 * 2. Comprime se:
 *    - Cliente suporta (Accept-Encoding: gzip, deflate, br)
 *    - Tipo de conteúdo textual (JSON, HTML, CSS, JS)
 *    - Resposta grande o suficiente (>= threshold)
 *
 * @example
 * ```typescript
 * // Internamente usado pelo middleware
 * if (shouldCompress(req, res)) {
 *   // Comprime a resposta
 * }
 * ```
 *
 * @remarks
 * - Delega decisão final para compression.filter() padrão
 * - Não comprime conteúdo já comprimido (imagens, vídeos)
 * - Respeita header Cache-Control: no-transform
 */
function shouldCompress(req: Request, res: Response): boolean {
  // Se a resposta já tem Content-Encoding, não comprime
  // Evita dupla compressão
  if (res.getHeader('Content-Encoding')) {
    return false;
  }

  // Se o cliente não suporta compressão, não comprime
  // Verifica presença do header Accept-Encoding
  if (!req.headers['accept-encoding']) {
    return false;
  }

  // Usa a função padrão do compression para decisão final
  // Considera tipo de conteúdo, tamanho e outras heurísticas
  return compression.filter(req, res);
}

// ====================================================================
// MIDDLEWARE PADRÃO (BALANCEADO)
// ====================================================================

/**
 * Middleware de compressão com configuração balanceada
 *
 * @description
 * Configuração padrão recomendada que equilibra compressão, velocidade
 * e uso de CPU. Adequada para a maioria dos casos de uso.
 *
 * @constant
 * @type {import('compression').CompressionMiddleware}
 *
 * @example
 * ```typescript
 * // No app.ts
 * import { compressionMiddleware } from '@shared/middlewares/compression.middleware';
 *
 * // Registrar APÓS helmet/cors, ANTES de body parsers
 * app.use(helmet());
 * app.use(cors());
 * app.use(compressionMiddleware);  // ← Aqui
 * app.use(express.json());
 * ```
 *
 * CONFIGURAÇÃO:
 *
 * 1. Level: 6 (escala 0-9)
 *    - Bom equilíbrio entre CPU e compressão
 *    - Comprime ~75% em média
 *    - Overhead de CPU: ~5%
 *
 * 2. Threshold: 1024 bytes (1KB)
 *    - Não vale a pena comprimir respostas muito pequenas
 *    - Overhead do gzip seria maior que o ganho
 *    - Respostas < 1KB são enviadas sem compressão
 *
 * 3. MemLevel: 8 (escala 1-9)
 *    - Uso moderado de memória
 *    - Buffer de ~256KB para compressão
 *
 * 4. Strategy: 0 (Z_DEFAULT_STRATEGY)
 *    - Estratégia padrão do zlib
 *    - Adequada para a maioria dos dados
 *
 * TIPOS COMPRIMIDOS:
 * - application/json
 * - application/javascript
 * - text/html, text/css, text/plain
 * - text/xml, application/xml
 * - Outros tipos textuais
 *
 * TIPOS NÃO COMPRIMIDOS:
 * - image/* (já comprimidos: JPEG, PNG, GIF)
 * - video/* (já comprimidos: MP4, WEBM)
 * - application/zip, application/gzip
 * - Conteúdo já com Content-Encoding
 *
 * @remarks
 * IMPORTANTE:
 * - Registre ANTES das rotas
 * - Registre DEPOIS de helmet/cors
 * - Registre ANTES de body parsers
 * - Cliente deve enviar Accept-Encoding: gzip
 *
 * PERFORMANCE:
 * - CPU extra: ~5%
 * - Memória extra: ~2-8MB
 * - Latência: +5-10ms para comprimir
 * - Economia de banda: 70-80%
 * - Tempo total menor (menos dados na rede)
 *
 * COMPATIBILIDADE:
 * - Todos os navegadores modernos
 * - Node.js clientes (axios, fetch, etc)
 * - Clientes HTTP que suportam gzip
 */
export const compressionMiddleware = compression({
  // Função que decide se comprime
  filter: shouldCompress,

  // Nível de compressão (0-9)
  // 0 = sem compressão, 1 = rápido, 9 = máximo
  // 6 é um bom equilíbrio entre velocidade e compressão
  level: 6,

  // Tamanho mínimo para comprimir (em bytes)
  // Respostas menores que 1KB não vale a pena comprimir
  // O overhead do gzip seria maior que o ganho
  threshold: 1024,

  // Tamanho do buffer de memória (1-9)
  // 8 = 256KB buffer (padrão: bom para maioria)
  memLevel: 8,

  // Strategy de compressão (0-4)
  // 0 = Z_DEFAULT_STRATEGY (bom para maioria dos dados)
  // 1 = Z_FILTERED (bom para dados gerados por filtros)
  // 2 = Z_HUFFMAN_ONLY (apenas Huffman coding)
  // 3 = Z_RLE (run-length encoding)
  // 4 = Z_FIXED (códigos fixos)
  strategy: 0,
});

// ====================================================================
// MIDDLEWARE AGRESSIVO (MÁXIMA COMPRESSÃO)
// ====================================================================

/**
 * Middleware de compressão agressiva
 *
 * @description
 * Configuração que prioriza máxima compressão sobre velocidade.
 * Use apenas quando bandwidth é mais crítico que CPU.
 *
 * @constant
 * @type {import('compression').CompressionMiddleware}
 *
 * @example
 * ```typescript
 * // Para APIs com banda cara ou lenta
 * import { aggressiveCompression } from '@shared/middlewares/compression.middleware';
 *
 * app.use(aggressiveCompression);
 * ```
 *
 * CONFIGURAÇÃO:
 * - Level: 9 (máximo)
 * - Threshold: 512 bytes (comprime mais coisas)
 * - MemLevel: 9 (mais memória)
 *
 * TRADE-OFFS:
 * - ✅ Compressão: ~80-85% (vs 75%)
 * - ✅ Economia de banda maior
 * - ❌ CPU: +15% (vs +5%)
 * - ❌ Latência: +15-25ms (vs +5-10ms)
 * - ❌ Memória: +4-16MB (vs +2-8MB)
 *
 * QUANDO USAR:
 * - Bandwidth muito caro ou limitado
 * - Rede muito lenta (2G, 3G)
 * - CPU sobra, banda não
 * - Respostas muito grandes (>100KB)
 *
 * QUANDO NÃO USAR:
 * - CPU limitada
 * - Latência crítica
 * - Respostas pequenas (<10KB)
 * - Muitas requisições simultâneas
 *
 * @remarks
 * ⚠️ ATENÇÃO:
 * - Usa 3x mais CPU que configuração padrão
 * - Pode impactar latência negativamente
 * - Teste performance antes de usar em produção
 */
export const aggressiveCompression = compression({
  filter: shouldCompress,
  level: 9, // Máxima compressão (mais CPU)
  threshold: 512, // Comprime a partir de 512 bytes
  memLevel: 9, // Mais memória para melhor compressão
});

// ====================================================================
// MIDDLEWARE LEVE (MÍNIMA CPU)
// ====================================================================

/**
 * Middleware de compressão leve
 *
 * @description
 * Configuração que prioriza velocidade e baixo uso de CPU.
 * Use quando CPU é limitada ou latência é crítica.
 *
 * @constant
 * @type {import('compression').CompressionMiddleware}
 *
 * @example
 * ```typescript
 * // Para servidores com CPU limitada
 * import { lightCompression } from '@shared/middlewares/compression.middleware';
 *
 * app.use(lightCompression);
 * ```
 *
 * CONFIGURAÇÃO:
 * - Level: 1 (mínimo)
 * - Threshold: 2048 bytes (apenas grandes)
 * - MemLevel: 6 (menos memória)
 *
 * TRADE-OFFS:
 * - ✅ CPU: +2% (muito baixo)
 * - ✅ Latência: +2-5ms (mínima)
 * - ✅ Memória: +1-4MB (pouca)
 * - ❌ Compressão: ~50-60% (vs 75%)
 * - ❌ Menos economia de banda
 *
 * QUANDO USAR:
 * - CPU limitada ou compartilhada
 * - Latência muito crítica
 * - Muitas requisições simultâneas
 * - Banda não é problema
 *
 * QUANDO NÃO USAR:
 * - Banda cara ou limitada
 * - Respostas muito grandes
 * - CPU sobra
 */
export const lightCompression = compression({
  filter: shouldCompress,
  level: 1, // Compressão rápida (pouco CPU)
  threshold: 2048, // Comprime apenas > 2KB
  memLevel: 6, // Menos memória
});

// ====================================================================
// UTILITÁRIOS
// ====================================================================

/**
 * Cria middleware de compressão com configuração customizada
 *
 * @description
 * Factory function para criar middleware de compressão com
 * configurações personalizadas para casos específicos.
 *
 * @param {object} options - Opções de configuração
 * @param {number} [options.level=6] - Nível de compressão (0-9)
 * @param {number} [options.threshold=1024] - Tamanho mínimo em bytes
 * @param {number} [options.memLevel=8] - Nível de memória (1-9)
 * @param {number} [options.strategy=0] - Estratégia de compressão (0-4)
 * @param {Function} [options.filter] - Função customizada de filtro
 *
 * @returns {import('compression').CompressionMiddleware} Middleware configurado
 *
 * @public
 *
 * @example
 * ```typescript
 * // Compressão customizada para API específica
 * const customCompression = createCustomCompression({
 *   level: 7,
 *   threshold: 2048,
 *   filter: (req, res) => {
 *     // Apenas para rotas /api/reports
 *     return req.path.startsWith('/api/reports');
 *   }
 * });
 *
 * app.use('/api/reports', customCompression);
 * ```
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
 * Desabilita compressão para uma rota específica
 *
 * @description
 * Middleware que desabilita compressão, útil para rotas que
 * já retornam dados comprimidos ou binários.
 *
 * @param {Request} _req - Objeto de requisição (não utilizado)
 * @param {Response} res - Objeto de resposta do Express
 * @param {Function} next - Função para próximo middleware
 *
 * @returns {void}
 *
 * @public
 *
 * @example
 * ```typescript
 * // Para rotas que retornam arquivos já comprimidos
 * import { noCompression } from '@shared/middlewares/compression.middleware';
 *
 * app.get('/download/file.zip', noCompression, (req, res) => {
 *   res.sendFile('file.zip');
 * });
 * ```
 */
export function noCompression(_req: Request, res: Response, next: Function): void {
  // Adiciona header que indica para não transformar
  res.setHeader('Cache-Control', 'no-transform');
  next();
}