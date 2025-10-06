// @ts-nocheck
// src/shared/middlewares/errorHandler.middleware.ts
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
import { AppError } from '@shared/errors/AppError';
import { log } from '../utils/logger';

/**
 * Sanitiza mensagem de erro (mantido do seu código)
 */
function sanitizeErrorMessage(error: any): string {
  if (stryMutAct_9fa48("2655")) {
    {}
  } else {
    stryCov_9fa48("2655");
    const message = stryMutAct_9fa48("2658") ? error.message && 'Erro desconhecido' : stryMutAct_9fa48("2657") ? false : stryMutAct_9fa48("2656") ? true : (stryCov_9fa48("2656", "2657", "2658"), error.message || (stryMutAct_9fa48("2659") ? "" : (stryCov_9fa48("2659"), 'Erro desconhecido')));
    let sanitized = message.replace(stryMutAct_9fa48("2662") ? /\/[^\S]+\.(ts|js|tsx|jsx)/gi : stryMutAct_9fa48("2661") ? /\/[\s]+\.(ts|js|tsx|jsx)/gi : stryMutAct_9fa48("2660") ? /\/[^\s]\.(ts|js|tsx|jsx)/gi : (stryCov_9fa48("2660", "2661", "2662"), /\/[^\s]+\.(ts|js|tsx|jsx)/gi), stryMutAct_9fa48("2663") ? "" : (stryCov_9fa48("2663"), '[arquivo]'));
    sanitized = sanitized.replace(stryMutAct_9fa48("2666") ? /SELECT\s+.FROM/gi : stryMutAct_9fa48("2665") ? /SELECT\S+.*?FROM/gi : stryMutAct_9fa48("2664") ? /SELECT\s.*?FROM/gi : (stryCov_9fa48("2664", "2665", "2666"), /SELECT\s+.*?FROM/gi), stryMutAct_9fa48("2667") ? "" : (stryCov_9fa48("2667"), 'consulta SQL'));
    sanitized = sanitized.replace(stryMutAct_9fa48("2669") ? /INSERT\S+INTO/gi : stryMutAct_9fa48("2668") ? /INSERT\sINTO/gi : (stryCov_9fa48("2668", "2669"), /INSERT\s+INTO/gi), stryMutAct_9fa48("2670") ? "" : (stryCov_9fa48("2670"), 'operação de inserção'));
    sanitized = sanitized.replace(stryMutAct_9fa48("2673") ? /UPDATE\s+.SET/gi : stryMutAct_9fa48("2672") ? /UPDATE\S+.*?SET/gi : stryMutAct_9fa48("2671") ? /UPDATE\s.*?SET/gi : (stryCov_9fa48("2671", "2672", "2673"), /UPDATE\s+.*?SET/gi), stryMutAct_9fa48("2674") ? "" : (stryCov_9fa48("2674"), 'operação de atualização'));
    sanitized = sanitized.replace(stryMutAct_9fa48("2685") ? /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\D+)?/g : stryMutAct_9fa48("2684") ? /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d)?/g : stryMutAct_9fa48("2683") ? /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)/g : stryMutAct_9fa48("2682") ? /\d{1,3}\.\d{1,3}\.\d{1,3}\.\D{1,3}(:\d+)?/g : stryMutAct_9fa48("2681") ? /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d(:\d+)?/g : stryMutAct_9fa48("2680") ? /\d{1,3}\.\d{1,3}\.\D{1,3}\.\d{1,3}(:\d+)?/g : stryMutAct_9fa48("2679") ? /\d{1,3}\.\d{1,3}\.\d\.\d{1,3}(:\d+)?/g : stryMutAct_9fa48("2678") ? /\d{1,3}\.\D{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/g : stryMutAct_9fa48("2677") ? /\d{1,3}\.\d\.\d{1,3}\.\d{1,3}(:\d+)?/g : stryMutAct_9fa48("2676") ? /\D{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/g : stryMutAct_9fa48("2675") ? /\d\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/g : (stryCov_9fa48("2675", "2676", "2677", "2678", "2679", "2680", "2681", "2682", "2683", "2684", "2685"), /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/g), stryMutAct_9fa48("2686") ? "" : (stryCov_9fa48("2686"), '[servidor]'));
    sanitized = sanitized.replace(stryMutAct_9fa48("2688") ? /user=\W+/gi : stryMutAct_9fa48("2687") ? /user=\w/gi : (stryCov_9fa48("2687", "2688"), /user=\w+/gi), stryMutAct_9fa48("2689") ? "" : (stryCov_9fa48("2689"), 'user=[oculto]'));
    sanitized = sanitized.replace(stryMutAct_9fa48("2691") ? /password=\W+/gi : stryMutAct_9fa48("2690") ? /password=\w/gi : (stryCov_9fa48("2690", "2691"), /password=\w+/gi), stryMutAct_9fa48("2692") ? "" : (stryCov_9fa48("2692"), 'password=[oculto]'));
    return sanitized;
  }
}

/**
 * Middleware global de tratamento de erros
 */
export function errorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction) {
  if (stryMutAct_9fa48("2693")) {
    {}
  } else {
    stryCov_9fa48("2693");
    if (stryMutAct_9fa48("2695") ? false : stryMutAct_9fa48("2694") ? true : (stryCov_9fa48("2694", "2695"), res.headersSent)) {
      if (stryMutAct_9fa48("2696")) {
        {}
      } else {
        stryCov_9fa48("2696");
        return next(err);
      }
    }
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const isOperational = err instanceof AppError ? err.isOperational : stryMutAct_9fa48("2697") ? true : (stryCov_9fa48("2697"), false);
    const context = err instanceof AppError ? err.context : undefined;

    // Log baseado no tipo
    if (stryMutAct_9fa48("2699") ? false : stryMutAct_9fa48("2698") ? true : (stryCov_9fa48("2698", "2699"), isOperational)) {
      if (stryMutAct_9fa48("2700")) {
        {}
      } else {
        stryCov_9fa48("2700");
        log.warn(stryMutAct_9fa48("2701") ? "" : (stryCov_9fa48("2701"), 'Erro operacional'), stryMutAct_9fa48("2702") ? {} : (stryCov_9fa48("2702"), {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode,
          message: err.message,
          context
        }));
      }
    } else {
      if (stryMutAct_9fa48("2703")) {
        {}
      } else {
        stryCov_9fa48("2703");
        log.error(stryMutAct_9fa48("2704") ? "" : (stryCov_9fa48("2704"), 'Erro não operacional'), stryMutAct_9fa48("2705") ? {} : (stryCov_9fa48("2705"), {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          error: err.message,
          stack: err.stack
        }));
      }
    }
    const isDevelopment = stryMutAct_9fa48("2708") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("2707") ? false : stryMutAct_9fa48("2706") ? true : (stryCov_9fa48("2706", "2707", "2708"), process.env.NODE_ENV === (stryMutAct_9fa48("2709") ? "" : (stryCov_9fa48("2709"), 'development')));
    if (stryMutAct_9fa48("2711") ? false : stryMutAct_9fa48("2710") ? true : (stryCov_9fa48("2710", "2711"), isDevelopment)) {
      if (stryMutAct_9fa48("2712")) {
        {}
      } else {
        stryCov_9fa48("2712");
        return res.status(statusCode).json(stryMutAct_9fa48("2713") ? {} : (stryCov_9fa48("2713"), {
          error: stryMutAct_9fa48("2716") ? err.name && 'Error' : stryMutAct_9fa48("2715") ? false : stryMutAct_9fa48("2714") ? true : (stryCov_9fa48("2714", "2715", "2716"), err.name || (stryMutAct_9fa48("2717") ? "" : (stryCov_9fa48("2717"), 'Error'))),
          message: err.message,
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
          requestId: req.requestId,
          context,
          stack: stryMutAct_9fa48("2719") ? err.stack.split('\n').slice(0, 5) : stryMutAct_9fa48("2718") ? err.stack?.split('\n') : (stryCov_9fa48("2718", "2719"), err.stack?.split(stryMutAct_9fa48("2720") ? "" : (stryCov_9fa48("2720"), '\n')).slice(0, 5))
        }));
      }
    }

    // Produção: sanitiza mensagem
    const userMessage = isOperational ? sanitizeErrorMessage(err) : stryMutAct_9fa48("2721") ? "" : (stryCov_9fa48("2721"), 'Erro interno do servidor. Tente novamente mais tarde.');
    res.status(statusCode).json(stryMutAct_9fa48("2722") ? {} : (stryCov_9fa48("2722"), {
      error: stryMutAct_9fa48("2725") ? err.name && 'Error' : stryMutAct_9fa48("2724") ? false : stryMutAct_9fa48("2723") ? true : (stryCov_9fa48("2723", "2724", "2725"), err.name || (stryMutAct_9fa48("2726") ? "" : (stryCov_9fa48("2726"), 'Error'))),
      message: userMessage,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      requestId: req.requestId
    }));
  }
}

/**
 * 404 - Rota não encontrada
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (stryMutAct_9fa48("2727")) {
    {}
  } else {
    stryCov_9fa48("2727");
    const error = new AppError(404, stryMutAct_9fa48("2728") ? `` : (stryCov_9fa48("2728"), `Rota não encontrada: ${req.method} ${req.originalUrl}`), stryMutAct_9fa48("2729") ? false : (stryCov_9fa48("2729"), true), stryMutAct_9fa48("2730") ? {} : (stryCov_9fa48("2730"), {
      method: req.method,
      path: req.originalUrl
    }));
    next(error);
  }
}

/**
 * asyncHandler (mantido do seu código)
 */
export function asyncHandler(fn: Function) {
  if (stryMutAct_9fa48("2731")) {
    {}
  } else {
    stryCov_9fa48("2731");
    return (req: Request, res: Response, next: NextFunction) => {
      if (stryMutAct_9fa48("2732")) {
        {}
      } else {
        stryCov_9fa48("2732");
        Promise.resolve(fn(req, res, next)).catch(next);
      }
    };
  }
}