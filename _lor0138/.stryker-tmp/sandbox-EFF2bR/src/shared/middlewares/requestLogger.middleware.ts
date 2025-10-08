// @ts-nocheck
// src/shared/middlewares/requestLogger.middleware.ts
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
import { log } from '../utils/logger';

// Estende o Request do Express para incluir requestId e startTime
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime?: number; // ✅ CORRIGIDO: opcional para evitar conflito
    }
  }
}

/**
 * Middleware que adiciona Request ID e loga todas as requisições
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (stryMutAct_9fa48("2894")) {
    {}
  } else {
    stryCov_9fa48("2894");
    // Gera ID único para rastrear a requisição
    req.requestId = uuidv4();
    req.startTime = Date.now();

    // Adiciona Request ID no header da resposta
    res.setHeader(stryMutAct_9fa48("2895") ? "" : (stryCov_9fa48("2895"), 'X-Request-ID'), req.requestId);

    // Loga início da requisição
    log.http(stryMutAct_9fa48("2896") ? "" : (stryCov_9fa48("2896"), 'Requisição recebida'), stryMutAct_9fa48("2897") ? {} : (stryCov_9fa48("2897"), {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get(stryMutAct_9fa48("2898") ? "" : (stryCov_9fa48("2898"), 'user-agent'))
    }));

    // Intercepta o fim da resposta para logar
    const originalSend = res.send;
    res.send = function (data: any): Response {
      if (stryMutAct_9fa48("2899")) {
        {}
      } else {
        stryCov_9fa48("2899");
        const duration = stryMutAct_9fa48("2900") ? Date.now() + (req.startTime || 0) : (stryCov_9fa48("2900"), Date.now() - (stryMutAct_9fa48("2903") ? req.startTime && 0 : stryMutAct_9fa48("2902") ? false : stryMutAct_9fa48("2901") ? true : (stryCov_9fa48("2901", "2902", "2903"), req.startTime || 0)));

        // Loga resposta
        const logLevel = (stryMutAct_9fa48("2907") ? res.statusCode < 400 : stryMutAct_9fa48("2906") ? res.statusCode > 400 : stryMutAct_9fa48("2905") ? false : stryMutAct_9fa48("2904") ? true : (stryCov_9fa48("2904", "2905", "2906", "2907"), res.statusCode >= 400)) ? stryMutAct_9fa48("2908") ? "" : (stryCov_9fa48("2908"), 'warn') : stryMutAct_9fa48("2909") ? "" : (stryCov_9fa48("2909"), 'http');
        log[logLevel](stryMutAct_9fa48("2910") ? "" : (stryCov_9fa48("2910"), 'Requisição finalizada'), stryMutAct_9fa48("2911") ? {} : (stryCov_9fa48("2911"), {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: duration,
          ip: req.ip
        }));

        // Se for erro, loga detalhes adicionais
        if (stryMutAct_9fa48("2915") ? res.statusCode < 500 : stryMutAct_9fa48("2914") ? res.statusCode > 500 : stryMutAct_9fa48("2913") ? false : stryMutAct_9fa48("2912") ? true : (stryCov_9fa48("2912", "2913", "2914", "2915"), res.statusCode >= 500)) {
          if (stryMutAct_9fa48("2916")) {
            {}
          } else {
            stryCov_9fa48("2916");
            log.error(stryMutAct_9fa48("2917") ? "" : (stryCov_9fa48("2917"), 'Erro no servidor'), stryMutAct_9fa48("2918") ? {} : (stryCov_9fa48("2918"), {
              requestId: req.requestId,
              method: req.method,
              url: req.originalUrl,
              statusCode: res.statusCode,
              response: (stryMutAct_9fa48("2921") ? typeof data !== 'string' : stryMutAct_9fa48("2920") ? false : stryMutAct_9fa48("2919") ? true : (stryCov_9fa48("2919", "2920", "2921"), typeof data === (stryMutAct_9fa48("2922") ? "" : (stryCov_9fa48("2922"), 'string')))) ? data : JSON.stringify(data)
            }));
          }
        }
        return originalSend.call(this, data);
      }
    };
    next();
  }
}