// @ts-nocheck
// src/shared/middlewares/timeout.middleware.ts
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
import timeout from 'connect-timeout';
import { Request, Response, NextFunction } from 'express';

/**
 * Configuração de timeouts
 */
const TIMEOUTS = stryMutAct_9fa48("2923") ? {} : (stryCov_9fa48("2923"), {
  // Timeout padrão para todas as requisições (30 segundos)
  DEFAULT: stryMutAct_9fa48("2924") ? "" : (stryCov_9fa48("2924"), '30s'),
  // Timeout maior para operações pesadas (60 segundos)
  HEAVY: stryMutAct_9fa48("2925") ? "" : (stryCov_9fa48("2925"), '60s'),
  // Timeout curto para health checks (5 segundos)
  HEALTH_CHECK: stryMutAct_9fa48("2926") ? "" : (stryCov_9fa48("2926"), '5s')
});

/**
 * Middleware de timeout global
 * Cancela requisições que demoram mais do que o limite configurado
 */
export const requestTimeout = timeout(TIMEOUTS.DEFAULT);

/**
 * Middleware de timeout para operações pesadas
 * Use em rotas que fazem queries complexas ou processamento intensivo
 */
export const heavyOperationTimeout = timeout(TIMEOUTS.HEAVY);

/**
 * Middleware de timeout para health checks
 * Health checks devem responder rapidamente
 */
export const healthCheckTimeout = timeout(TIMEOUTS.HEALTH_CHECK);

/**
 * Handler para requisições que excederam o timeout
 * Este middleware deve vir DEPOIS do timeout middleware
 */
export const timeoutErrorHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (stryMutAct_9fa48("2927")) {
    {}
  } else {
    stryCov_9fa48("2927");
    // Verifica se a requisição excedeu o timeout
    if (stryMutAct_9fa48("2930") ? false : stryMutAct_9fa48("2929") ? true : stryMutAct_9fa48("2928") ? req.timedout : (stryCov_9fa48("2928", "2929", "2930"), !req.timedout)) {
      if (stryMutAct_9fa48("2931")) {
        {}
      } else {
        stryCov_9fa48("2931");
        next();
        return;
      }
    }

    // Se já enviou resposta, não faz nada
    if (stryMutAct_9fa48("2933") ? false : stryMutAct_9fa48("2932") ? true : (stryCov_9fa48("2932", "2933"), res.headersSent)) {
      if (stryMutAct_9fa48("2934")) {
        {}
      } else {
        stryCov_9fa48("2934");
        return;
      }
    }

    // Loga o timeout
    console.error(stryMutAct_9fa48("2935") ? "" : (stryCov_9fa48("2935"), 'Request timeout:'), stryMutAct_9fa48("2936") ? {} : (stryCov_9fa48("2936"), {
      requestId: (req as any).id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      timeout: TIMEOUTS.DEFAULT
    }));

    // Retorna erro 503 (Service Unavailable) - mais apropriado que 408
    res.status(503).json(stryMutAct_9fa48("2937") ? {} : (stryCov_9fa48("2937"), {
      success: stryMutAct_9fa48("2938") ? true : (stryCov_9fa48("2938"), false),
      error: stryMutAct_9fa48("2939") ? "" : (stryCov_9fa48("2939"), 'Request Timeout'),
      message: stryMutAct_9fa48("2940") ? "" : (stryCov_9fa48("2940"), 'A requisição demorou muito para ser processada e foi cancelada pelo servidor.'),
      details: stryMutAct_9fa48("2941") ? {} : (stryCov_9fa48("2941"), {
        timeout: TIMEOUTS.DEFAULT,
        suggestion: stryMutAct_9fa48("2942") ? "" : (stryCov_9fa48("2942"), 'Tente novamente em alguns instantes. Se o problema persistir, contate o suporte.')
      })
    }));
  }
};

/**
 * Middleware que previne que código continue executando após timeout
 * Use este middleware em rotas específicas APÓS o timeout middleware
 */
export const haltOnTimedout = (req: Request, _res: Response, next: NextFunction): void => {
  if (stryMutAct_9fa48("2943")) {
    {}
  } else {
    stryCov_9fa48("2943");
    if (stryMutAct_9fa48("2946") ? false : stryMutAct_9fa48("2945") ? true : stryMutAct_9fa48("2944") ? req.timedout : (stryCov_9fa48("2944", "2945", "2946"), !req.timedout)) {
      if (stryMutAct_9fa48("2947")) {
        {}
      } else {
        stryCov_9fa48("2947");
        next();
      }
    }
    // Se timeout ocorreu, não chama next() - para a execução
  }
};

/**
 * Configuração de timeout para exportação
 */
export const timeoutConfig = stryMutAct_9fa48("2948") ? {} : (stryCov_9fa48("2948"), {
  default: TIMEOUTS.DEFAULT,
  heavy: TIMEOUTS.HEAVY,
  healthCheck: TIMEOUTS.HEALTH_CHECK
});