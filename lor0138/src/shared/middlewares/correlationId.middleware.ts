// src/shared/middlewares/correlationId.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@shared/utils/logger';

/**
 * @fileoverview Middleware de Correlation ID (Request Tracing)
 *
 * Implementa rastreamento end-to-end de requisições através de um identificador
 * único (UUID v4) que acompanha toda a jornada da request pelo sistema.
 *
 * **Funcionalidades:**
 * - Aceita Correlation ID do cliente (múltiplos headers suportados)
 * - Gera UUID v4 automaticamente se não fornecido
 * - Adiciona ao objeto Request (req.id)
 * - Retorna no header de resposta (X-Correlation-ID)
 * - Adiciona timestamp para métricas de performance
 *
 * **Benefícios:**
 * - Debug facilitado: rastreie uma requisição específica nos logs
 * - Correlação entre sistemas: mesmo ID em múltiplos microserviços
 * - Métricas: agrupe dados por requisição
 * - Troubleshooting: identifique problemas específicos
 *
 * **Headers Suportados (ordem de prioridade):**
 * 1. X-Correlation-ID (padrão recomendado)
 * 2. X-Request-ID (compatibilidade)
 * 3. correlation-id (alternativa lowercase)
 *
 * @module CorrelationIdMiddleware
 * @category Middlewares
 *
 * @example
 * ```typescript
 * // Cliente envia ID customizado:
 * curl -H "X-Correlation-ID: abc-123" http://api.com/endpoint
 * // Response: X-Correlation-ID: abc-123
 *
 * // Servidor gera ID automaticamente:
 * curl http://api.com/endpoint
 * // Response: X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
 * ```
 */

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Headers aceitos para Correlation ID (ordem de prioridade)
 *
 * @constant
 * @private
 */
const CORRELATION_ID_HEADERS = [
  'x-correlation-id',
  'x-request-id',
  'correlation-id',
] as const;

/**
 * Nome do header retornado na resposta
 *
 * @constant
 * @private
 */
const RESPONSE_HEADER_NAME = 'X-Correlation-ID';

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

/**
 * Middleware de Correlation ID
 *
 * Middleware que adiciona ou extrai um Correlation ID único para cada requisição.
 * Deve ser o **PRIMEIRO** middleware na cadeia para garantir que todas as
 * operações subsequentes tenham acesso ao ID.
 *
 * **Fluxo de Execução:**
 * 1. Verifica headers do cliente em ordem de prioridade
 * 2. Se encontrar, usa o ID do cliente
 * 3. Se não encontrar, gera novo UUID v4
 * 4. Adiciona ao req.id para uso global
 * 5. Adiciona timestamp (req.startTime) para métricas
 * 6. Define header de resposta (X-Correlation-ID)
 * 7. Opcionalmente loga recebimento de ID do cliente
 * 8. Chama próximo middleware
 *
 * **Integração com Logs:**
 * Todos os logs devem incluir o correlationId:
 * ```typescript
 * log.info('Operação realizada', {
 *   correlationId: req.id,
 *   // ... outros dados
 * });
 * ```
 *
 * **Integração com Express Types:**
 * Requer extensão do tipo Request (express.d.ts):
 * ```typescript
 * declare global {
 *   namespace Express {
 *     interface Request {
 *       id: string;
 *       startTime?: number;
 *     }
 *   }
 * }
 * ```
 *
 * @param {Request} req - Request do Express
 * @param {Response} res - Response do Express
 * @param {NextFunction} next - Próximo middleware
 * @returns {void}
 *
 * @example
 * ```typescript
 * // Setup no app.ts (PRIMEIRO middleware)
 * app.use(correlationIdMiddleware);
 * app.use(express.json());
 * // ... outros middlewares
 * ```
 *
 * @example
 * ```typescript
 * // Cliente envia ID customizado
 * // Request: X-Correlation-ID: my-trace-001
 * // Response: X-Correlation-ID: my-trace-001
 *
 * // Cliente não envia ID
 * // Request: (sem header)
 * // Response: X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
 * ```
 *
 * @critical
 * - DEVE ser o primeiro middleware na cadeia
 * - Requer express.d.ts com extensão do tipo Request
 * - UUID v4 garante unicidade global
 *
 * @performance
 * - Overhead mínimo (< 0.1ms)
 * - Geração de UUID é rápida
 * - Não bloqueia I/O
 */
export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Tenta extrair Correlation ID dos headers do cliente
  // Verifica múltiplos headers em ordem de prioridade
  const clientCorrelationId = CORRELATION_ID_HEADERS.reduce<string | undefined>(
    (found, headerName) => found || (req.headers[headerName] as string),
    undefined
  );

  // 2. Usa ID do cliente ou gera novo UUID v4
  const correlationId = clientCorrelationId || uuidv4();

  // 3. Adiciona ao request para uso em toda aplicação
  // Qualquer middleware/controller pode acessar via req.id
  req.id = correlationId;

  // 4. Adiciona timestamp para cálculo de duração da requisição
  // Útil para métricas de performance
  req.startTime = Date.now();

  // 5. Retorna correlation ID no header de resposta
  // Cliente pode usar para rastreamento ou debug
  res.setHeader(RESPONSE_HEADER_NAME, correlationId);

  // 6. Log de debug se cliente enviou ID
  // Útil para rastrear origem de IDs customizados
  if (clientCorrelationId) {
    log.debug('Correlation ID recebido do cliente', {
      correlationId,
      method: req.method,
      url: req.url,
    });
  }

  next();
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém Correlation ID do request
 *
 * Helper function para extrair o Correlation ID de forma segura.
 * Retorna 'unknown' se não encontrado (edge case).
 *
 * **Uso:**
 * Útil em contextos onde o request não está diretamente disponível,
 * como em funções auxiliares ou helpers.
 *
 * @param {Request} req - Request do Express
 * @returns {string} Correlation ID ou 'unknown'
 *
 * @example
 * ```typescript
 * import { getCorrelationId } from '@shared/middlewares/correlationId.middleware';
 *
 * function processarDados(req: Request) {
 *   const correlationId = getCorrelationId(req);
 *
 *   // Usar em logs ou operações
 *   log.info('Processando dados', { correlationId });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Em helpers sem acesso direto ao req.id
 * function helper(req: Request) {
 *   const id = getCorrelationId(req);
 *   // Garantido retornar string válida
 * }
 * ```
 *
 * @note
 * Retorna 'unknown' apenas em casos extremos onde middleware não foi executado
 */
export const getCorrelationId = (req: Request): string => {
  return req.id || 'unknown';
};

/**
 * Adiciona Correlation ID em objetos de log
 *
 * Helper function que mescla Correlation ID com dados de log existentes.
 * Facilita padronização de logs com correlationId.
 *
 * **Uso:**
 * Adiciona automaticamente o correlationId a qualquer objeto de log,
 * evitando repetição manual e garantindo consistência.
 *
 * @param {Request} req - Request do Express
 * @param {Record<string, any>} logData - Dados do log a serem enriquecidos
 * @returns {Record<string, any>} Dados originais + correlationId
 *
 * @example
 * ```typescript
 * import { withCorrelationId } from '@shared/middlewares/correlationId.middleware';
 * import { log } from '@shared/utils/logger';
 *
 * // Antes (manual)
 * log.info({
 *   correlationId: req.id,
 *   message: 'Processando item',
 *   itemCodigo: '7530110'
 * });
 *
 * // Depois (com helper)
 * log.info(withCorrelationId(req, {
 *   message: 'Processando item',
 *   itemCodigo: '7530110'
 * }));
 * // Output: { correlationId: '...', message: '...', itemCodigo: '...' }
 * ```
 *
 * @example
 * ```typescript
 * // Em services/repositories
 * class ItemService {
 *   async buscar(itemCodigo: string, req: Request) {
 *     log.info(withCorrelationId(req, {
 *       action: 'buscar_item',
 *       itemCodigo
 *     }));
 *
 *     const item = await this.repository.findByCodigo(itemCodigo);
 *
 *     log.info(withCorrelationId(req, {
 *       action: 'item_encontrado',
 *       itemCodigo,
 *       found: !!item
 *     }));
 *
 *     return item;
 *   }
 * }
 * ```
 *
 * @note
 * - Não modifica o objeto original (logData)
 * - Retorna novo objeto com correlationId adicionado
 * - correlationId sempre vem primeiro no objeto resultante
 */
export const withCorrelationId = (
  req: Request,
  logData: Record<string, any>
): Record<string, any> => {
  return {
    correlationId: req.id,
    ...logData,
  };
};