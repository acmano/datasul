// @ts-nocheck
// src/shared/middlewares/rateLimiter.middleware.ts
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
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter geral para toda a API
 * 100 requisições por 15 minutos por IP
 */
export const apiLimiter = rateLimit(stryMutAct_9fa48("2832") ? {} : (stryCov_9fa48("2832"), {
  windowMs: stryMutAct_9fa48("2833") ? 15 * 60 / 1000 : (stryCov_9fa48("2833"), (stryMutAct_9fa48("2834") ? 15 / 60 : (stryCov_9fa48("2834"), 15 * 60)) * 1000),
  // 15 minutos
  max: 100,
  // limite de requisições
  message: stryMutAct_9fa48("2835") ? {} : (stryCov_9fa48("2835"), {
    success: stryMutAct_9fa48("2836") ? true : (stryCov_9fa48("2836"), false),
    error: stryMutAct_9fa48("2837") ? "" : (stryCov_9fa48("2837"), 'Muitas requisições. Tente novamente em alguns minutos.')
  }),
  standardHeaders: stryMutAct_9fa48("2838") ? false : (stryCov_9fa48("2838"), true),
  // Retorna info no header `RateLimit-*`
  legacyHeaders: stryMutAct_9fa48("2839") ? true : (stryCov_9fa48("2839"), false),
  // Desabilita headers `X-RateLimit-*`
  handler: (req, res) => {
    if (stryMutAct_9fa48("2840")) {
      {}
    } else {
      stryCov_9fa48("2840");
      res.status(429).json(stryMutAct_9fa48("2841") ? {} : (stryCov_9fa48("2841"), {
        success: stryMutAct_9fa48("2842") ? true : (stryCov_9fa48("2842"), false),
        error: stryMutAct_9fa48("2843") ? "" : (stryCov_9fa48("2843"), 'Limite de requisições excedido. Aguarde alguns minutos.')
      }));
    }
  },
  skip: req => {
    if (stryMutAct_9fa48("2844")) {
      {}
    } else {
      stryCov_9fa48("2844");
      return stryMutAct_9fa48("2847") ? process.env.NODE_ENV === 'development' || process.env.SKIP_RATE_LIMIT === 'true' : stryMutAct_9fa48("2846") ? false : stryMutAct_9fa48("2845") ? true : (stryCov_9fa48("2845", "2846", "2847"), (stryMutAct_9fa48("2849") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("2848") ? true : (stryCov_9fa48("2848", "2849"), process.env.NODE_ENV === (stryMutAct_9fa48("2850") ? "" : (stryCov_9fa48("2850"), 'development')))) && (stryMutAct_9fa48("2852") ? process.env.SKIP_RATE_LIMIT !== 'true' : stryMutAct_9fa48("2851") ? true : (stryCov_9fa48("2851", "2852"), process.env.SKIP_RATE_LIMIT === (stryMutAct_9fa48("2853") ? "" : (stryCov_9fa48("2853"), 'true')))));
    }
  }
}));

/**
 * Rate limiter mais restritivo para endpoints críticos
 * 20 requisições por 5 minutos por IP
 */
export const strictLimiter = rateLimit(stryMutAct_9fa48("2854") ? {} : (stryCov_9fa48("2854"), {
  windowMs: stryMutAct_9fa48("2855") ? 5 * 60 / 1000 : (stryCov_9fa48("2855"), (stryMutAct_9fa48("2856") ? 5 / 60 : (stryCov_9fa48("2856"), 5 * 60)) * 1000),
  // 5 minutos
  max: 20,
  message: stryMutAct_9fa48("2857") ? {} : (stryCov_9fa48("2857"), {
    success: stryMutAct_9fa48("2858") ? true : (stryCov_9fa48("2858"), false),
    error: stryMutAct_9fa48("2859") ? "" : (stryCov_9fa48("2859"), 'Muitas requisições neste endpoint. Aguarde alguns minutos.')
  }),
  standardHeaders: stryMutAct_9fa48("2860") ? false : (stryCov_9fa48("2860"), true),
  legacyHeaders: stryMutAct_9fa48("2861") ? true : (stryCov_9fa48("2861"), false),
  handler: (req, res) => {
    if (stryMutAct_9fa48("2862")) {
      {}
    } else {
      stryCov_9fa48("2862");
      res.status(429).json(stryMutAct_9fa48("2863") ? {} : (stryCov_9fa48("2863"), {
        success: stryMutAct_9fa48("2864") ? true : (stryCov_9fa48("2864"), false),
        error: stryMutAct_9fa48("2865") ? "" : (stryCov_9fa48("2865"), 'Limite de requisições excedido para este endpoint.')
      }));
    }
  }
}));

/**
 * Rate limiter por item específico
 * Previne consultas repetidas do mesmo item
 * 10 requisições do mesmo item por minuto
 */
export const itemLimiter = rateLimit(stryMutAct_9fa48("2866") ? {} : (stryCov_9fa48("2866"), {
  windowMs: stryMutAct_9fa48("2867") ? 1 * 60 / 1000 : (stryCov_9fa48("2867"), (stryMutAct_9fa48("2868") ? 1 / 60 : (stryCov_9fa48("2868"), 1 * 60)) * 1000),
  // 1 minuto
  max: 10,
  message: stryMutAct_9fa48("2869") ? {} : (stryCov_9fa48("2869"), {
    success: stryMutAct_9fa48("2870") ? true : (stryCov_9fa48("2870"), false),
    error: stryMutAct_9fa48("2871") ? "" : (stryCov_9fa48("2871"), 'Muitas consultas para este item. Aguarde um momento.')
  }),
  standardHeaders: stryMutAct_9fa48("2872") ? false : (stryCov_9fa48("2872"), true),
  legacyHeaders: stryMutAct_9fa48("2873") ? true : (stryCov_9fa48("2873"), false),
  // Usa keyGenerator simples - o rate limiter já trata IPv6 internamente
  keyGenerator: req => {
    if (stryMutAct_9fa48("2874")) {
      {}
    } else {
      stryCov_9fa48("2874");
      // Combina IP padrão com itemCodigo
      const itemCodigo = stryMutAct_9fa48("2877") ? req.params.itemCodigo && 'no-item' : stryMutAct_9fa48("2876") ? false : stryMutAct_9fa48("2875") ? true : (stryCov_9fa48("2875", "2876", "2877"), req.params.itemCodigo || (stryMutAct_9fa48("2878") ? "" : (stryCov_9fa48("2878"), 'no-item')));
      return stryMutAct_9fa48("2879") ? `` : (stryCov_9fa48("2879"), `item:${itemCodigo}`);
    }
  },
  handler: (req, res) => {
    if (stryMutAct_9fa48("2880")) {
      {}
    } else {
      stryCov_9fa48("2880");
      res.status(429).json(stryMutAct_9fa48("2881") ? {} : (stryCov_9fa48("2881"), {
        success: stryMutAct_9fa48("2882") ? true : (stryCov_9fa48("2882"), false),
        error: stryMutAct_9fa48("2883") ? "" : (stryCov_9fa48("2883"), 'Muitas consultas para este item específico. Aguarde um momento.')
      }));
    }
  },
  skip: req => {
    if (stryMutAct_9fa48("2884")) {
      {}
    } else {
      stryCov_9fa48("2884");
      return stryMutAct_9fa48("2887") ? process.env.NODE_ENV === 'development' || process.env.SKIP_RATE_LIMIT === 'true' : stryMutAct_9fa48("2886") ? false : stryMutAct_9fa48("2885") ? true : (stryCov_9fa48("2885", "2886", "2887"), (stryMutAct_9fa48("2889") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("2888") ? true : (stryCov_9fa48("2888", "2889"), process.env.NODE_ENV === (stryMutAct_9fa48("2890") ? "" : (stryCov_9fa48("2890"), 'development')))) && (stryMutAct_9fa48("2892") ? process.env.SKIP_RATE_LIMIT !== 'true' : stryMutAct_9fa48("2891") ? true : (stryCov_9fa48("2891", "2892"), process.env.SKIP_RATE_LIMIT === (stryMutAct_9fa48("2893") ? "" : (stryCov_9fa48("2893"), 'true')))));
    }
  }
}));