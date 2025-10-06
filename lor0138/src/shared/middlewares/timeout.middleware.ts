// src/shared/middlewares/timeout.middleware.ts

import timeout from 'connect-timeout';
import { Request, Response, NextFunction } from 'express';

/**
 * @fileoverview Middlewares de Timeout para Requisições HTTP
 *
 * Fornece middlewares para limitar o tempo de execução de requisições,
 * prevenindo que requests lentos bloqueiem o servidor indefinidamente.
 *
 * **Tipos de Timeout:**
 * - **DEFAULT** (30s): Requisições normais
 * - **HEAVY** (60s): Operações pesadas (relatórios, exports)
 * - **HEALTH_CHECK** (5s): Health checks devem ser rápidos
 *
 * **Importante:**
 * - Timeouts cancelam a requisição no lado do servidor
 * - O cliente pode ainda esperar resposta (depende do HTTP keep-alive)
 * - Use `haltOnTimedout` para parar execução após timeout
 * - Use `timeoutErrorHandler` para capturar e responder timeouts
 *
 * @module TimeoutMiddleware
 * @category Middlewares
 */

// ============================================================================
// CONFIGURAÇÃO DE TIMEOUTS
// ============================================================================

/**
 * Configuração de timeouts por tipo de operação
 *
 * @constant
 * @readonly
 */
const TIMEOUTS = {
  /** Timeout padrão para todas as requisições (30 segundos) */
  DEFAULT: '30s',

  /** Timeout maior para operações pesadas (60 segundos) */
  HEAVY: '60s',

  /** Timeout curto para health checks (5 segundos) */
  HEALTH_CHECK: '5s',
} as const;

// ============================================================================
// MIDDLEWARES DE TIMEOUT
// ============================================================================

/**
 * Middleware de timeout global
 *
 * Cancela requisições que demoram mais de 30 segundos.
 * Deve ser usado como middleware global no Express.
 *
 * **Uso:**
 * ```typescript
 * app.use(requestTimeout);
 * ```
 *
 * **Comportamento:**
 * - Define timeout de 30s para todas as requisições
 * - Marca req.timedout = true quando timeout ocorre
 * - NÃO envia resposta automaticamente (use timeoutErrorHandler)
 *
 * @constant
 * @type {RequestHandler}
 *
 * @example
 * ```typescript
 * // No app.ts
 * app.use(requestTimeout);
 * app.use(timeoutErrorHandler); // Captura timeouts
 * ```
 *
 * @note
 * Coloque ANTES das rotas mas DEPOIS de middlewares de parsing (body-parser)
 */
export const requestTimeout = timeout(TIMEOUTS.DEFAULT);

/**
 * Middleware de timeout para operações pesadas
 *
 * Timeout estendido (60s) para operações que naturalmente demoram mais:
 * - Geração de relatórios complexos
 * - Exports de dados volumosos
 * - Processamento de arquivos grandes
 * - Queries complexas com joins pesados
 *
 * **Uso:**
 * ```typescript
 * router.get('/report/full', heavyOperationTimeout, controller.generateReport);
 * ```
 *
 * @constant
 * @type {RequestHandler}
 *
 * @example
 * ```typescript
 * // Em rotas específicas
 * router.get('/exports/items',
 *   heavyOperationTimeout,
 *   haltOnTimedout,
 *   exportController.exportAllItems
 * );
 *
 * router.post('/reports/sales',
 *   heavyOperationTimeout,
 *   haltOnTimedout,
 *   reportController.generateSalesReport
 * );
 * ```
 *
 * @note
 * Use apenas em rotas específicas que realmente precisam de mais tempo
 */
export const heavyOperationTimeout = timeout(TIMEOUTS.HEAVY);

/**
 * Middleware de timeout para health checks
 *
 * Timeout curto (5s) para health checks que devem responder rapidamente.
 * Health checks lentos indicam problema e devem falhar fast.
 *
 * **Uso:**
 * ```typescript
 * router.get('/health', healthCheckTimeout, healthController.check);
 * ```
 *
 * @constant
 * @type {RequestHandler}
 *
 * @example
 * ```typescript
 * // Health check routes
 * router.get('/health', healthCheckTimeout, healthController.check);
 * router.get('/health/live', healthCheckTimeout, healthController.liveness);
 * router.get('/health/ready', healthCheckTimeout, healthController.readiness);
 * ```
 *
 * @critical
 * Health checks DEVEM responder em < 5s ou sistema é considerado unhealthy
 */
export const healthCheckTimeout = timeout(TIMEOUTS.HEALTH_CHECK);

// ============================================================================
// HANDLER DE ERROS DE TIMEOUT
// ============================================================================

/**
 * Handler para requisições que excederam o timeout
 *
 * Middleware que captura timeouts e envia resposta apropriada ao cliente.
 * Deve vir DEPOIS do middleware de timeout na cadeia.
 *
 * **Comportamento:**
 * 1. Verifica se req.timedout === true
 * 2. Se não, passa para próximo middleware (next())
 * 3. Se sim, envia erro 503 Service Unavailable
 * 4. Loga o timeout com detalhes da requisição
 *
 * **Status Code: 503 (Service Unavailable)**
 * - Mais apropriado que 408 (Request Timeout) para timeouts server-side
 * - Indica problema temporário do servidor
 * - Cliente pode tentar novamente (retry)
 *
 * @param {Request} req - Request do Express
 * @param {Response} res - Response do Express
 * @param {NextFunction} next - Próximo middleware
 * @returns {void}
 *
 * @example
 * ```typescript
 * // Setup global no app.ts
 * app.use(requestTimeout);
 *
 * // ... suas rotas aqui ...
 *
 * // Handler de timeout ANTES do handler de erro 404/500
 * app.use(timeoutErrorHandler);
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 * ```
 *
 * @example
 * ```typescript
 * // Resposta de timeout:
 * {
 *   "success": false,
 *   "error": "Request Timeout",
 *   "message": "A requisição demorou muito para ser processada...",
 *   "details": {
 *     "timeout": "30s",
 *     "suggestion": "Tente novamente em alguns instantes..."
 *   }
 * }
 * ```
 *
 * @critical
 * - Deve vir DEPOIS do middleware de timeout
 * - Deve vir ANTES dos handlers 404/500
 * - Não chama next() se timeout (para propagação)
 */
export const timeoutErrorHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Se não houve timeout, continua normalmente
  if (!req.timedout) {
    next();
    return;
  }

  // Se já enviou resposta (edge case), não faz nada
  if (res.headersSent) {
    return;
  }

  // Loga o timeout para análise
  console.error('Request timeout:', {
    requestId: (req as any).id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    timeout: TIMEOUTS.DEFAULT,
  });

  // Retorna erro 503 (Service Unavailable)
  res.status(503).json({
    success: false,
    error: 'Request Timeout',
    message:
      'A requisição demorou muito para ser processada e foi cancelada pelo servidor.',
    details: {
      timeout: TIMEOUTS.DEFAULT,
      suggestion:
        'Tente novamente em alguns instantes. Se o problema persistir, contate o suporte.',
    },
  });
};

// ============================================================================
// HELPER - HALT ON TIMEOUT
// ============================================================================

/**
 * Middleware que previne execução após timeout
 *
 * Para a cadeia de middlewares se timeout já ocorreu.
 * Útil para prevenir que código continue executando após timeout.
 *
 * **Uso:**
 * ```typescript
 * router.get('/heavy',
 *   heavyOperationTimeout,
 *   haltOnTimedout,  // Para execução se timeout
 *   controller.heavyOperation
 * );
 * ```
 *
 * **Comportamento:**
 * - Se req.timedout === false → chama next() (continua)
 * - Se req.timedout === true → NÃO chama next() (para)
 *
 * @param {Request} req - Request do Express
 * @param {Response} _res - Response do Express (não usado)
 * @param {NextFunction} next - Próximo middleware
 * @returns {void}
 *
 * @example
 * ```typescript
 * router.post('/process',
 *   heavyOperationTimeout,
 *   haltOnTimedout, // Importante: antes do controller
 *   async (req, res) => {
 *     // Se timeout, este código NÃO executa
 *     const result = await heavyProcessing(req.body);
 *     res.json(result);
 *   }
 * );
 * ```
 *
 * @note
 * Use em rotas com operações custosas para evitar desperdício de recursos
 */
export const haltOnTimedout = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.timedout) {
    next();
  }
  // Se timeout ocorreu, NÃO chama next() - para a execução
};

// ============================================================================
// CONFIGURAÇÃO EXPORTADA
// ============================================================================

/**
 * Configuração de timeout para exportação
 *
 * Valores usados pelos middlewares de timeout.
 * Útil para referência ou testes.
 *
 * @constant
 * @readonly
 *
 * @example
 * ```typescript
 * import { timeoutConfig } from './timeout.middleware';
 *
 * console.log(`Timeout padrão: ${timeoutConfig.default}`);
 * // Output: "Timeout padrão: 30s"
 * ```
 */
export const timeoutConfig = {
  /** Timeout padrão (30s) */
  default: TIMEOUTS.DEFAULT,

  /** Timeout para operações pesadas (60s) */
  heavy: TIMEOUTS.HEAVY,

  /** Timeout para health checks (5s) */
  healthCheck: TIMEOUTS.HEALTH_CHECK,
};