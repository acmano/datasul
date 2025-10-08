// @ts-nocheck
// src/shared/middlewares/correlationId.middleware.ts
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@shared/utils/logger';

/**
 * Middleware de Correlation ID
 * 
 * Funcionalidades:
 * 1. Aceita correlation ID do cliente (headers: X-Correlation-ID, X-Request-ID, correlation-id)
 * 2. Gera novo UUID se não fornecido
 * 3. Adiciona ao objeto request (req.id)
 * 4. Retorna no header X-Correlation-ID
 * 5. Adiciona timestamp para métricas de performance
 * 
 * @example
 * // Cliente envia:
 * curl -H "X-Correlation-ID: abc-123" http://lor0138.lorenzetti.ibe:3000/api/...
 * 
 * // Servidor usa "abc-123" e retorna no header:
 * X-Correlation-ID: abc-123
 * 
 * // Se cliente não enviar, servidor gera:
 * X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (stryMutAct_9fa48("2529")) {
    {}
  } else {
    stryCov_9fa48("2529");
    // 1. Tenta pegar correlation ID dos headers do cliente (ordem de prioridade)
    const clientCorrelationId = stryMutAct_9fa48("2532") ? (req.headers['x-correlation-id'] as string || req.headers['x-request-id'] as string) && req.headers['correlation-id'] as string : stryMutAct_9fa48("2531") ? false : stryMutAct_9fa48("2530") ? true : (stryCov_9fa48("2530", "2531", "2532"), (stryMutAct_9fa48("2534") ? req.headers['x-correlation-id'] as string && req.headers['x-request-id'] as string : stryMutAct_9fa48("2533") ? false : (stryCov_9fa48("2533", "2534"), req.headers['x-correlation-id'] as string || req.headers['x-request-id'] as string)) || req.headers['correlation-id'] as string);

    // 2. Usa ID do cliente ou gera novo UUID
    const correlationId = stryMutAct_9fa48("2537") ? clientCorrelationId && uuidv4() : stryMutAct_9fa48("2536") ? false : stryMutAct_9fa48("2535") ? true : (stryCov_9fa48("2535", "2536", "2537"), clientCorrelationId || uuidv4());

    // 3. Adiciona ao request para uso em toda aplicação
    req.id = correlationId;

    // 4. Adiciona timestamp para cálculo de duração
    req.startTime = Date.now();

    // 5. Retorna correlation ID no header de resposta
    res.setHeader(stryMutAct_9fa48("2538") ? "" : (stryCov_9fa48("2538"), 'X-Correlation-ID'), correlationId);

    // 6. Log de início da requisição (opcional, pode ser feito no requestLogger)
    if (stryMutAct_9fa48("2540") ? false : stryMutAct_9fa48("2539") ? true : (stryCov_9fa48("2539", "2540"), clientCorrelationId)) {
      if (stryMutAct_9fa48("2541")) {
        {}
      } else {
        stryCov_9fa48("2541");
        log.debug(stryMutAct_9fa48("2542") ? "" : (stryCov_9fa48("2542"), 'Correlation ID recebido do cliente'), stryMutAct_9fa48("2543") ? {} : (stryCov_9fa48("2543"), {
          correlationId,
          method: req.method,
          url: req.url
        }));
      }
    }
    next();
  }
};

/**
 * Helper para obter correlation ID do request
 * Útil em lugares onde o request não está disponível diretamente
 */
export const getCorrelationId = (req: Request): string => {
  if (stryMutAct_9fa48("2544")) {
    {}
  } else {
    stryCov_9fa48("2544");
    return stryMutAct_9fa48("2547") ? req.id && 'unknown' : stryMutAct_9fa48("2546") ? false : stryMutAct_9fa48("2545") ? true : (stryCov_9fa48("2545", "2546", "2547"), req.id || (stryMutAct_9fa48("2548") ? "" : (stryCov_9fa48("2548"), 'unknown')));
  }
};

/**
 * Helper para adicionar correlation ID em objetos de log
 */
export const withCorrelationId = (req: Request, logData: Record<string, any>): Record<string, any> => {
  if (stryMutAct_9fa48("2549")) {
    {}
  } else {
    stryCov_9fa48("2549");
    return stryMutAct_9fa48("2550") ? {} : (stryCov_9fa48("2550"), {
      ...logData,
      correlationId: req.id
    });
  }
};