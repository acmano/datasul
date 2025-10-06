// @ts-nocheck
// src/shared/middlewares/metricsMiddleware.ts
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
import { metricsManager } from '@infrastructure/metrics/MetricsManager';

/**
 * Middleware para coletar métricas de todas as requisições HTTP
 * 
 * Coleta:
 * - Total de requisições
 * - Duração das requisições
 * - Status codes
 * - Requisições em progresso
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (stryMutAct_9fa48("2776")) {
    {}
  } else {
    stryCov_9fa48("2776");
    // Ignora endpoint de métricas para não criar loop
    if (stryMutAct_9fa48("2779") ? req.path !== '/metrics' : stryMutAct_9fa48("2778") ? false : stryMutAct_9fa48("2777") ? true : (stryCov_9fa48("2777", "2778", "2779"), req.path === (stryMutAct_9fa48("2780") ? "" : (stryCov_9fa48("2780"), '/metrics')))) {
      if (stryMutAct_9fa48("2781")) {
        {}
      } else {
        stryCov_9fa48("2781");
        return next();
      }
    }
    const startTime = Date.now();
    const method = req.method;

    // Normaliza a rota para agrupar métricas
    // Ex: /api/lor0138/item/dadosCadastrais/informacoesGerais/7530110
    //  -> /api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo
    const route = normalizeRoute(req.path);

    // Incrementa contador de requisições em progresso
    metricsManager.httpRequestsInProgress.inc(stryMutAct_9fa48("2782") ? {} : (stryCov_9fa48("2782"), {
      method,
      route
    }));

    // Captura quando a resposta é finalizada
    res.on(stryMutAct_9fa48("2783") ? "" : (stryCov_9fa48("2783"), 'finish'), () => {
      if (stryMutAct_9fa48("2784")) {
        {}
      } else {
        stryCov_9fa48("2784");
        const duration = stryMutAct_9fa48("2785") ? (Date.now() - startTime) * 1000 : (stryCov_9fa48("2785"), (stryMutAct_9fa48("2786") ? Date.now() + startTime : (stryCov_9fa48("2786"), Date.now() - startTime)) / 1000); // segundos
        const statusCode = res.statusCode.toString();

        // Decrementa requisições em progresso
        metricsManager.httpRequestsInProgress.dec(stryMutAct_9fa48("2787") ? {} : (stryCov_9fa48("2787"), {
          method,
          route
        }));

        // Incrementa total de requisições
        metricsManager.httpRequestsTotal.inc(stryMutAct_9fa48("2788") ? {} : (stryCov_9fa48("2788"), {
          method,
          route,
          status_code: statusCode
        }));

        // Registra duração da requisição
        metricsManager.httpRequestDuration.observe(stryMutAct_9fa48("2789") ? {} : (stryCov_9fa48("2789"), {
          method,
          route,
          status_code: statusCode
        }), duration);
      }
    });
    next();
  }
}

/**
 * Normaliza a rota para agrupar métricas
 * Remove IDs específicos e mantém a estrutura da rota
 */
function normalizeRoute(path: string): string {
  if (stryMutAct_9fa48("2790")) {
    {}
  } else {
    stryCov_9fa48("2790");
    // Remove query strings
    path = path.split(stryMutAct_9fa48("2791") ? "" : (stryCov_9fa48("2791"), '?'))[0];

    // Padrões comuns para substituir por placeholders
    const patterns = stryMutAct_9fa48("2792") ? [] : (stryCov_9fa48("2792"), [// Item codes (números ou códigos alfanuméricos)
    stryMutAct_9fa48("2793") ? {} : (stryCov_9fa48("2793"), {
      regex: stryMutAct_9fa48("2796") ? /\/api\/lor0138\/item\/dadosCadastrais\/informacoesGerais\/[\/]+$/ : stryMutAct_9fa48("2795") ? /\/api\/lor0138\/item\/dadosCadastrais\/informacoesGerais\/[^\/]$/ : stryMutAct_9fa48("2794") ? /\/api\/lor0138\/item\/dadosCadastrais\/informacoesGerais\/[^\/]+/ : (stryCov_9fa48("2794", "2795", "2796"), /\/api\/lor0138\/item\/dadosCadastrais\/informacoesGerais\/[^\/]+$/),
      replacement: stryMutAct_9fa48("2797") ? "" : (stryCov_9fa48("2797"), '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo')
    }), // UUIDs
    stryMutAct_9fa48("2798") ? {} : (stryCov_9fa48("2798"), {
      regex: stryMutAct_9fa48("2808") ? /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[^0-9a-f]{12}/gi : stryMutAct_9fa48("2807") ? /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]/gi : stryMutAct_9fa48("2806") ? /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[^0-9a-f]{4}-[0-9a-f]{12}/gi : stryMutAct_9fa48("2805") ? /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]-[0-9a-f]{12}/gi : stryMutAct_9fa48("2804") ? /[0-9a-f]{8}-[0-9a-f]{4}-[^0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi : stryMutAct_9fa48("2803") ? /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]-[0-9a-f]{4}-[0-9a-f]{12}/gi : stryMutAct_9fa48("2802") ? /[0-9a-f]{8}-[^0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi : stryMutAct_9fa48("2801") ? /[0-9a-f]{8}-[0-9a-f]-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi : stryMutAct_9fa48("2800") ? /[^0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi : stryMutAct_9fa48("2799") ? /[0-9a-f]-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi : (stryCov_9fa48("2799", "2800", "2801", "2802", "2803", "2804", "2805", "2806", "2807", "2808"), /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi),
      replacement: stryMutAct_9fa48("2809") ? "" : (stryCov_9fa48("2809"), ':uuid')
    }), // Números genéricos no final da URL
    stryMutAct_9fa48("2810") ? {} : (stryCov_9fa48("2810"), {
      regex: stryMutAct_9fa48("2813") ? /\/\D+$/ : stryMutAct_9fa48("2812") ? /\/\d$/ : stryMutAct_9fa48("2811") ? /\/\d+/ : (stryCov_9fa48("2811", "2812", "2813"), /\/\d+$/),
      replacement: stryMutAct_9fa48("2814") ? "" : (stryCov_9fa48("2814"), '/:id')
    })]);
    for (const pattern of patterns) {
      if (stryMutAct_9fa48("2815")) {
        {}
      } else {
        stryCov_9fa48("2815");
        if (stryMutAct_9fa48("2817") ? false : stryMutAct_9fa48("2816") ? true : (stryCov_9fa48("2816", "2817"), pattern.regex.test(path))) {
          if (stryMutAct_9fa48("2818")) {
            {}
          } else {
            stryCov_9fa48("2818");
            return path.replace(pattern.regex, pattern.replacement);
          }
        }
      }
    }
    return path;
  }
}

/**
 * Middleware para coletar métricas de rate limiting
 * Deve ser usado APÓS o rate limiter
 */
export function rateLimitMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (stryMutAct_9fa48("2819")) {
    {}
  } else {
    stryCov_9fa48("2819");
    const route = normalizeRoute(req.path);
    const userId = stryMutAct_9fa48("2822") ? (req as any).userId && 'anonymous' : stryMutAct_9fa48("2821") ? false : stryMutAct_9fa48("2820") ? true : (stryCov_9fa48("2820", "2821", "2822"), (req as any).userId || (stryMutAct_9fa48("2823") ? "" : (stryCov_9fa48("2823"), 'anonymous')));

    // Se a requisição foi bloqueada pelo rate limiter
    if (stryMutAct_9fa48("2826") ? res.statusCode !== 429 : stryMutAct_9fa48("2825") ? false : stryMutAct_9fa48("2824") ? true : (stryCov_9fa48("2824", "2825", "2826"), res.statusCode === 429)) {
      if (stryMutAct_9fa48("2827")) {
        {}
      } else {
        stryCov_9fa48("2827");
        metricsManager.rateLimitRequestsBlocked.inc(stryMutAct_9fa48("2828") ? {} : (stryCov_9fa48("2828"), {
          route,
          user_id: userId,
          reason: stryMutAct_9fa48("2829") ? "" : (stryCov_9fa48("2829"), 'rate_limit_exceeded')
        }));
      }
    } else {
      if (stryMutAct_9fa48("2830")) {
        {}
      } else {
        stryCov_9fa48("2830");
        metricsManager.rateLimitRequestsAllowed.inc(stryMutAct_9fa48("2831") ? {} : (stryCov_9fa48("2831"), {
          route,
          user_id: userId
        }));
      }
    }
    next();
  }
}