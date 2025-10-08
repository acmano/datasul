// @ts-nocheck
// src/shared/middlewares/helmet.middleware.ts
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
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Security Headers usando Helmet.js
 * 
 * Adiciona proteção contra:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME type sniffing
 * - DNS Prefetch Control
 * - Frame Options
 * - Powered-By header removal
 * - HSTS (HTTP Strict Transport Security)
 * - Content Security Policy
 */

export const helmetMiddleware = helmet(stryMutAct_9fa48("2733") ? {} : (stryCov_9fa48("2733"), {
  // Content Security Policy - Define fontes permitidas de conteúdo
  contentSecurityPolicy: stryMutAct_9fa48("2734") ? {} : (stryCov_9fa48("2734"), {
    directives: stryMutAct_9fa48("2735") ? {} : (stryCov_9fa48("2735"), {
      defaultSrc: stryMutAct_9fa48("2736") ? [] : (stryCov_9fa48("2736"), [stryMutAct_9fa48("2737") ? "" : (stryCov_9fa48("2737"), "'self'")]),
      styleSrc: stryMutAct_9fa48("2738") ? [] : (stryCov_9fa48("2738"), [stryMutAct_9fa48("2739") ? "" : (stryCov_9fa48("2739"), "'self'"), stryMutAct_9fa48("2740") ? "" : (stryCov_9fa48("2740"), "'unsafe-inline'")]),
      scriptSrc: stryMutAct_9fa48("2741") ? [] : (stryCov_9fa48("2741"), [stryMutAct_9fa48("2742") ? "" : (stryCov_9fa48("2742"), "'self'")]),
      imgSrc: stryMutAct_9fa48("2743") ? [] : (stryCov_9fa48("2743"), [stryMutAct_9fa48("2744") ? "" : (stryCov_9fa48("2744"), "'self'"), stryMutAct_9fa48("2745") ? "" : (stryCov_9fa48("2745"), 'data:'), stryMutAct_9fa48("2746") ? "" : (stryCov_9fa48("2746"), 'https:')]),
      connectSrc: stryMutAct_9fa48("2747") ? [] : (stryCov_9fa48("2747"), [stryMutAct_9fa48("2748") ? "" : (stryCov_9fa48("2748"), "'self'")]),
      fontSrc: stryMutAct_9fa48("2749") ? [] : (stryCov_9fa48("2749"), [stryMutAct_9fa48("2750") ? "" : (stryCov_9fa48("2750"), "'self'")]),
      objectSrc: stryMutAct_9fa48("2751") ? [] : (stryCov_9fa48("2751"), [stryMutAct_9fa48("2752") ? "" : (stryCov_9fa48("2752"), "'none'")]),
      mediaSrc: stryMutAct_9fa48("2753") ? [] : (stryCov_9fa48("2753"), [stryMutAct_9fa48("2754") ? "" : (stryCov_9fa48("2754"), "'self'")]),
      frameSrc: stryMutAct_9fa48("2755") ? [] : (stryCov_9fa48("2755"), [stryMutAct_9fa48("2756") ? "" : (stryCov_9fa48("2756"), "'none'")])
    })
  }),
  // HSTS - Force HTTPS (desabilite em desenvolvimento se não usar HTTPS)
  hsts: stryMutAct_9fa48("2757") ? {} : (stryCov_9fa48("2757"), {
    maxAge: 31536000,
    // 1 ano em segundos
    includeSubDomains: stryMutAct_9fa48("2758") ? false : (stryCov_9fa48("2758"), true),
    preload: stryMutAct_9fa48("2759") ? false : (stryCov_9fa48("2759"), true)
  }),
  // Remove o header X-Powered-By que revela tecnologia
  hidePoweredBy: stryMutAct_9fa48("2760") ? false : (stryCov_9fa48("2760"), true),
  // Previne clickjacking
  frameguard: stryMutAct_9fa48("2761") ? {} : (stryCov_9fa48("2761"), {
    action: stryMutAct_9fa48("2762") ? "" : (stryCov_9fa48("2762"), 'deny')
  }),
  // Previne MIME type sniffing
  noSniff: stryMutAct_9fa48("2763") ? false : (stryCov_9fa48("2763"), true),
  // Força modo de proteção XSS do navegador
  xssFilter: stryMutAct_9fa48("2764") ? false : (stryCov_9fa48("2764"), true),
  // Controla DNS prefetching
  dnsPrefetchControl: stryMutAct_9fa48("2765") ? {} : (stryCov_9fa48("2765"), {
    allow: stryMutAct_9fa48("2766") ? true : (stryCov_9fa48("2766"), false)
  }),
  // Desabilita client-side caching para conteúdo sensível
  // Pode ajustar conforme necessário
  referrerPolicy: stryMutAct_9fa48("2767") ? {} : (stryCov_9fa48("2767"), {
    policy: stryMutAct_9fa48("2768") ? "" : (stryCov_9fa48("2768"), 'strict-origin-when-cross-origin')
  })
}));

/**
 * Middleware adicional para headers customizados
 */
export const customSecurityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  if (stryMutAct_9fa48("2769")) {
    {}
  } else {
    stryCov_9fa48("2769");
    // Adiciona headers personalizados específicos da aplicação

    // Previne que a página seja incorporada em frames/iframes
    res.setHeader(stryMutAct_9fa48("2770") ? "" : (stryCov_9fa48("2770"), 'X-Frame-Options'), stryMutAct_9fa48("2771") ? "" : (stryCov_9fa48("2771"), 'DENY'));

    // Adiciona política de permissões (Feature Policy/Permissions Policy)
    res.setHeader(stryMutAct_9fa48("2772") ? "" : (stryCov_9fa48("2772"), 'Permissions-Policy'), stryMutAct_9fa48("2773") ? "" : (stryCov_9fa48("2773"), 'geolocation=(), microphone=(), camera=(), payment=(), usb=()'));

    // Remove informações de servidor
    res.removeHeader(stryMutAct_9fa48("2774") ? "" : (stryCov_9fa48("2774"), 'X-Powered-By'));
    res.removeHeader(stryMutAct_9fa48("2775") ? "" : (stryCov_9fa48("2775"), 'Server'));
    next();
  }
};