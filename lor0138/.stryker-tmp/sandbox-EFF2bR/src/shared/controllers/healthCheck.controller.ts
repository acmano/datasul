// @ts-nocheck
// src/shared/controllers/healthCheck.controller.ts
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
import { Request, Response } from 'express';
import { HealthCheckService } from '../services/healthCheck.service'; // ✅ CORRIGIDO: path relativo

/**
 * Controller para endpoints de health check
 */
export class HealthCheckController {
  /**
   * GET /health
   * Health check completo do sistema
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    if (stryMutAct_9fa48("2284")) {
      {}
    } else {
      stryCov_9fa48("2284");
      try {
        if (stryMutAct_9fa48("2285")) {
          {}
        } else {
          stryCov_9fa48("2285");
          const health = await HealthCheckService.check();
          const statusCode = (stryMutAct_9fa48("2288") ? health.status !== 'healthy' : stryMutAct_9fa48("2287") ? false : stryMutAct_9fa48("2286") ? true : (stryCov_9fa48("2286", "2287", "2288"), health.status === (stryMutAct_9fa48("2289") ? "" : (stryCov_9fa48("2289"), 'healthy')))) ? 200 : 503;
          res.status(statusCode).json(health);
        }
      } catch (error) {
        if (stryMutAct_9fa48("2290")) {
          {}
        } else {
          stryCov_9fa48("2290");
          console.error(stryMutAct_9fa48("2291") ? "" : (stryCov_9fa48("2291"), 'Erro no health check:'), error);
          res.status(503).json(stryMutAct_9fa48("2292") ? {} : (stryCov_9fa48("2292"), {
            status: stryMutAct_9fa48("2293") ? "" : (stryCov_9fa48("2293"), 'unhealthy'),
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : stryMutAct_9fa48("2294") ? "" : (stryCov_9fa48("2294"), 'Unknown error')
          }));
        }
      }
    }
  }

  /**
   * GET /health/live
   * Liveness probe - verifica se o processo está vivo
   */
  static async liveness(req: Request, res: Response): Promise<void> {
    if (stryMutAct_9fa48("2295")) {
      {}
    } else {
      stryCov_9fa48("2295");
      // Se chegou aqui, o processo está vivo
      res.status(200).json(stryMutAct_9fa48("2296") ? {} : (stryCov_9fa48("2296"), {
        status: stryMutAct_9fa48("2297") ? "" : (stryCov_9fa48("2297"), 'alive'),
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }));
    }
  }

  /**
   * GET /health/ready
   * Readiness probe - verifica se está pronto para receber tráfego
   */
  static async readiness(req: Request, res: Response): Promise<void> {
    if (stryMutAct_9fa48("2298")) {
      {}
    } else {
      stryCov_9fa48("2298");
      try {
        if (stryMutAct_9fa48("2299")) {
          {}
        } else {
          stryCov_9fa48("2299");
          const health = await HealthCheckService.check();

          // Pronto se status for healthy ou degraded
          // Não pronto apenas se for unhealthy
          const isReady = stryMutAct_9fa48("2302") ? health.status === 'unhealthy' : stryMutAct_9fa48("2301") ? false : stryMutAct_9fa48("2300") ? true : (stryCov_9fa48("2300", "2301", "2302"), health.status !== (stryMutAct_9fa48("2303") ? "" : (stryCov_9fa48("2303"), 'unhealthy')));
          const statusCode = isReady ? 200 : 503;
          res.status(statusCode).json(stryMutAct_9fa48("2304") ? {} : (stryCov_9fa48("2304"), {
            status: isReady ? stryMutAct_9fa48("2305") ? "" : (stryCov_9fa48("2305"), 'ready') : stryMutAct_9fa48("2306") ? "" : (stryCov_9fa48("2306"), 'not_ready'),
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
          }));
        }
      } catch (error) {
        if (stryMutAct_9fa48("2307")) {
          {}
        } else {
          stryCov_9fa48("2307");
          res.status(503).json(stryMutAct_9fa48("2308") ? {} : (stryCov_9fa48("2308"), {
            status: stryMutAct_9fa48("2309") ? "" : (stryCov_9fa48("2309"), 'not_ready'),
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : stryMutAct_9fa48("2310") ? "" : (stryCov_9fa48("2310"), 'Unknown error')
          }));
        }
      }
    }
  }
}