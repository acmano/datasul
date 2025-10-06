// @ts-nocheck
// src/api/metrics/routes.ts
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
import { Router, Request, Response } from 'express';
import { metricsManager } from '@infrastructure/metrics/MetricsManager';
const router = Router();

/**
 * GET /metrics
 * Retorna todas as métricas no formato Prometheus
 * 
 * Este endpoint é usado pelo Prometheus para scraping
 */
router.get(stryMutAct_9fa48("308") ? "" : (stryCov_9fa48("308"), '/'), async (req: Request, res: Response) => {
  if (stryMutAct_9fa48("309")) {
    {}
  } else {
    stryCov_9fa48("309");
    try {
      if (stryMutAct_9fa48("310")) {
        {}
      } else {
        stryCov_9fa48("310");
        res.set(stryMutAct_9fa48("311") ? "" : (stryCov_9fa48("311"), 'Content-Type'), metricsManager.getRegistry().contentType);
        const metrics = await metricsManager.getMetrics();
        res.end(metrics);
      }
    } catch (error) {
      if (stryMutAct_9fa48("312")) {
        {}
      } else {
        stryCov_9fa48("312");
        console.error(stryMutAct_9fa48("313") ? "" : (stryCov_9fa48("313"), 'Erro ao obter métricas:'), error);
        res.status(500).json(stryMutAct_9fa48("314") ? {} : (stryCov_9fa48("314"), {
          error: stryMutAct_9fa48("315") ? "" : (stryCov_9fa48("315"), 'Erro ao obter métricas'),
          message: (error as Error).message
        }));
      }
    }
  }
});

/**
 * GET /metrics/health
 * Health check específico para métricas
 */
router.get(stryMutAct_9fa48("316") ? "" : (stryCov_9fa48("316"), '/health'), (req: Request, res: Response) => {
  if (stryMutAct_9fa48("317")) {
    {}
  } else {
    stryCov_9fa48("317");
    const isReady = metricsManager.isReady();
    res.status(isReady ? 200 : 503).json(stryMutAct_9fa48("318") ? {} : (stryCov_9fa48("318"), {
      status: isReady ? stryMutAct_9fa48("319") ? "" : (stryCov_9fa48("319"), 'healthy') : stryMutAct_9fa48("320") ? "" : (stryCov_9fa48("320"), 'unhealthy'),
      metrics: stryMutAct_9fa48("321") ? {} : (stryCov_9fa48("321"), {
        enabled: stryMutAct_9fa48("322") ? false : (stryCov_9fa48("322"), true),
        ready: isReady
      })
    }));
  }
});
export default router;