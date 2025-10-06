// src/shared/middlewares/requestLogger.middleware.ts

/**
 * @fileoverview Middleware de logging de requisições HTTP
 *
 * @description
 * Middleware responsável por registrar logs detalhados de todas as requisições
 * HTTP que passam pela aplicação. Captura informações de entrada, saída,
 * duração e erros, facilitando debugging e auditoria.
 *
 * FUNCIONALIDADES:
 * - Gera ID único para cada requisição (UUID v4)
 * - Loga início e fim de cada requisição
 * - Calcula duração da requisição
 * - Adiciona Request ID nos headers de resposta
 * - Intercepta erros do servidor (5xx)
 * - Níveis de log automáticos baseados em status code
 *
 * @module shared/middlewares/requestLogger
 *
 * @requires uuid
 * @requires @shared/utils/logger
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../utils/logger';

// ====================================================================
// EXTENSÕES DE TIPOS
// ====================================================================

/**
 * Estende o Request do Express para incluir propriedades customizadas
 *
 * @description
 * Adiciona campos necessários para tracking e métricas de requisições.
 *
 * @property {string} requestId - ID único da requisição (UUID v4)
 * @property {number} [startTime] - Timestamp do início da requisição (ms)
 */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime?: number;
    }
  }
}

// ====================================================================
// MIDDLEWARE PRINCIPAL
// ====================================================================

/**
 * Middleware de logging de requisições
 *
 * @description
 * Registra logs detalhados de todas as requisições HTTP. Gera ID único,
 * calcula duração, e escolhe nível de log apropriado baseado no status code.
 *
 * @param {Request} req - Objeto de requisição do Express
 * @param {Response} res - Objeto de resposta do Express
 * @param {NextFunction} next - Função para passar controle ao próximo middleware
 *
 * @returns {void}
 *
 * @public
 *
 * @example
 * ```typescript
 * // No app.ts
 * import { requestLogger } from '@shared/middlewares/requestLogger.middleware';
 *
 * app.use(requestLogger);
 * ```
 *
 * ORDEM DE EXECUÇÃO:
 * 1. Gera requestId único
 * 2. Marca startTime
 * 3. Adiciona X-Request-ID no header de resposta
 * 4. Loga início da requisição
 * 5. Intercepta res.send() para logar fim
 * 6. Calcula duração
 * 7. Escolhe nível de log apropriado
 * 8. Loga resposta com detalhes
 *
 * NÍVEIS DE LOG:
 * - 'http': Status 200-399 (sucesso)
 * - 'warn': Status 400-499 (erro cliente)
 * - 'error': Status 500-599 (erro servidor)
 *
 * HEADERS DE RESPOSTA:
 * - X-Request-ID: UUID único da requisição
 *
 * @remarks
 * IMPORTANTE:
 * - Deve ser registrado APÓS correlationId.middleware
 * - Não interfere no fluxo da requisição
 * - Intercepta res.send() de forma transparente
 * - Logs de erro incluem corpo da resposta para debug
 *
 * COMPATIBILIDADE:
 * - Se correlationId.middleware estiver ativo, use req.id ao invés de req.requestId
 * - startTime pode conflitar com outros middlewares, use com cuidado
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // ====================================================================
  // INICIALIZAÇÃO
  // ====================================================================

  /**
   * Gera ID único para rastrear a requisição
   * UUID v4 garante unicidade global
   */
  req.requestId = uuidv4();

  /**
   * Marca timestamp do início da requisição
   * Usado para calcular duração total
   */
  req.startTime = Date.now();

  /**
   * Adiciona Request ID no header da resposta
   * Permite ao cliente rastrear a requisição
   */
  res.setHeader('X-Request-ID', req.requestId);

  // ====================================================================
  // LOG DE INÍCIO
  // ====================================================================

  /**
   * Loga informações iniciais da requisição
   * Útil para debugging e auditoria
   */
  log.http('Requisição recebida', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // ====================================================================
  // INTERCEPTAÇÃO DE RESPOSTA
  // ====================================================================

  /**
   * Preserva referência original do método res.send()
   * Necessário para chamar após nosso processamento
   */
  const originalSend = res.send;

  /**
   * Sobrescreve res.send() para interceptar resposta
   *
   * @description
   * Intercepta o momento em que a resposta é enviada para logar
   * informações finais, calcular duração e detectar erros.
   *
   * @param {any} data - Dados da resposta
   * @returns {Response} Resposta do Express
   */
  res.send = function (data: any): Response {
    // Calcular duração da requisição
    const duration = Date.now() - (req.startTime || 0);

    // Determinar nível de log baseado no status code
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';

    // Logar finalização da requisição
    log[logLevel]('Requisição finalizada', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: duration,
      ip: req.ip,
    });

    // Se for erro do servidor (5xx), logar detalhes adicionais
    if (res.statusCode >= 500) {
      log.error('Erro no servidor', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        response: typeof data === 'string' ? data : JSON.stringify(data),
      });
    }

    // Chamar método original para enviar resposta
    return originalSend.call(this, data);
  };

  // Passar controle para próximo middleware
  next();
}

// ====================================================================
// UTILITÁRIOS
// ====================================================================

/**
 * Extrai Request ID do objeto de requisição
 *
 * @description
 * Helper function para obter o Request ID. Útil em lugares onde
 * o objeto Request não está disponível diretamente.
 *
 * @param {Request} req - Objeto de requisição do Express
 * @returns {string} Request ID ou 'unknown' se não encontrado
 *
 * @public
 *
 * @example
 * ```typescript
 * import { getRequestId } from '@shared/middlewares/requestLogger.middleware';
 *
 * const requestId = getRequestId(req);
 * console.log(`Processing request: ${requestId}`);
 * ```
 */
export function getRequestId(req: Request): string {
  return req.requestId || 'unknown';
}

/**
 * Adiciona Request ID em objetos de log
 *
 * @description
 * Helper function para enriquecer objetos de log com Request ID.
 * Facilita correlação de logs relacionados à mesma requisição.
 *
 * @param {Request} req - Objeto de requisição do Express
 * @param {Record<string, any>} logData - Dados a serem logados
 * @returns {Record<string, any>} Objeto com Request ID adicionado
 *
 * @public
 *
 * @example
 * ```typescript
 * import { withRequestId } from '@shared/middlewares/requestLogger.middleware';
 *
 * log.info('Processando item', withRequestId(req, {
 *   itemCodigo: '7530110',
 *   action: 'fetch'
 * }));
 * // Log: { requestId: 'uuid...', itemCodigo: '7530110', action: 'fetch' }
 * ```
 */
export function withRequestId(
  req: Request,
  logData: Record<string, any>
): Record<string, any> {
  return {
    ...logData,
    requestId: req.requestId,
  };
}

/**
 * Calcula duração de uma requisição
 *
 * @description
 * Calcula quanto tempo passou desde o início da requisição.
 * Útil para métricas de performance.
 *
 * @param {Request} req - Objeto de requisição do Express
 * @returns {number} Duração em milissegundos
 *
 * @public
 *
 * @example
 * ```typescript
 * import { getRequestDuration } from '@shared/middlewares/requestLogger.middleware';
 *
 * const duration = getRequestDuration(req);
 * console.log(`Request took ${duration}ms`);
 * ```
 *
 * @remarks
 * Retorna 0 se startTime não estiver definido
 */
export function getRequestDuration(req: Request): number {
  if (!req.startTime) {
    return 0;
  }
  return Date.now() - req.startTime;
}

/**
 * Formata informações da requisição para log
 *
 * @description
 * Extrai e formata informações relevantes da requisição
 * em um objeto padronizado para logging.
 *
 * @param {Request} req - Objeto de requisição do Express
 * @returns {object} Objeto com informações formatadas
 *
 * @public
 *
 * @example
 * ```typescript
 * import { formatRequestInfo } from '@shared/middlewares/requestLogger.middleware';
 *
 * const info = formatRequestInfo(req);
 * log.info('Request details', info);
 * ```
 */
export function formatRequestInfo(req: Request) {
  return {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
    startTime: req.startTime,
  };
}