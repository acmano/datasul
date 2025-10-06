// @ts-nocheck
// src/shared/middlewares/cors.middleware.ts
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
import cors, { CorsOptions } from 'cors';
import { Request, Response, NextFunction } from 'express';
import { appConfig } from '@config/app.config';

/**
 * Valida se a origem é da rede interna permitida
 */
function isAllowedOrigin(origin: string | undefined): boolean {
  if (stryMutAct_9fa48("2551")) {
    {}
  } else {
    stryCov_9fa48("2551");
    if (stryMutAct_9fa48("2554") ? false : stryMutAct_9fa48("2553") ? true : stryMutAct_9fa48("2552") ? origin : (stryCov_9fa48("2552", "2553", "2554"), !origin)) {
      if (stryMutAct_9fa48("2555")) {
        {}
      } else {
        stryCov_9fa48("2555");
        // Permite requisições sem origin (ex: Postman, curl, apps mobile)
        return stryMutAct_9fa48("2556") ? false : (stryCov_9fa48("2556"), true);
      }
    }
    try {
      if (stryMutAct_9fa48("2557")) {
        {}
      } else {
        stryCov_9fa48("2557");
        const url = new URL(origin);
        const hostname = url.hostname;

        // Lista de domínios internos permitidos
        const allowedDomains = stryMutAct_9fa48("2558") ? [] : (stryCov_9fa48("2558"), [stryMutAct_9fa48("2559") ? "" : (stryCov_9fa48("2559"), 'lorenzetti.ibe'), appConfig.baseUrl // Desenvolvimento
        ]);

        // Verifica se termina com algum domínio permitido
        const isDomainAllowed = stryMutAct_9fa48("2560") ? allowedDomains.every(domain => hostname === domain || hostname.endsWith(`.${domain}`)) : (stryCov_9fa48("2560"), allowedDomains.some(stryMutAct_9fa48("2561") ? () => undefined : (stryCov_9fa48("2561"), domain => stryMutAct_9fa48("2564") ? hostname === domain && hostname.endsWith(`.${domain}`) : stryMutAct_9fa48("2563") ? false : stryMutAct_9fa48("2562") ? true : (stryCov_9fa48("2562", "2563", "2564"), (stryMutAct_9fa48("2566") ? hostname !== domain : stryMutAct_9fa48("2565") ? false : (stryCov_9fa48("2565", "2566"), hostname === domain)) || (stryMutAct_9fa48("2567") ? hostname.startsWith(`.${domain}`) : (stryCov_9fa48("2567"), hostname.endsWith(stryMutAct_9fa48("2568") ? `` : (stryCov_9fa48("2568"), `.${domain}`))))))));
        if (stryMutAct_9fa48("2570") ? false : stryMutAct_9fa48("2569") ? true : (stryCov_9fa48("2569", "2570"), isDomainAllowed)) {
          if (stryMutAct_9fa48("2571")) {
            {}
          } else {
            stryCov_9fa48("2571");
            return stryMutAct_9fa48("2572") ? false : (stryCov_9fa48("2572"), true);
          }
        }

        // Verifica range de IPs da rede privada classe A (10.x.x.x)
        const ipPattern = stryMutAct_9fa48("2580") ? /^10\.\d{1,3}\.\d{1,3}\.\D{1,3}$/ : stryMutAct_9fa48("2579") ? /^10\.\d{1,3}\.\d{1,3}\.\d$/ : stryMutAct_9fa48("2578") ? /^10\.\d{1,3}\.\D{1,3}\.\d{1,3}$/ : stryMutAct_9fa48("2577") ? /^10\.\d{1,3}\.\d\.\d{1,3}$/ : stryMutAct_9fa48("2576") ? /^10\.\D{1,3}\.\d{1,3}\.\d{1,3}$/ : stryMutAct_9fa48("2575") ? /^10\.\d\.\d{1,3}\.\d{1,3}$/ : stryMutAct_9fa48("2574") ? /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}/ : stryMutAct_9fa48("2573") ? /10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/ : (stryCov_9fa48("2573", "2574", "2575", "2576", "2577", "2578", "2579", "2580"), /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        if (stryMutAct_9fa48("2582") ? false : stryMutAct_9fa48("2581") ? true : (stryCov_9fa48("2581", "2582"), ipPattern.test(hostname))) {
          if (stryMutAct_9fa48("2583")) {
            {}
          } else {
            stryCov_9fa48("2583");
            return stryMutAct_9fa48("2584") ? false : (stryCov_9fa48("2584"), true);
          }
        }

        // Verifica localhost IPs
        if (stryMutAct_9fa48("2587") ? hostname === '127.0.0.1' && hostname === '::1' : stryMutAct_9fa48("2586") ? false : stryMutAct_9fa48("2585") ? true : (stryCov_9fa48("2585", "2586", "2587"), (stryMutAct_9fa48("2589") ? hostname !== '127.0.0.1' : stryMutAct_9fa48("2588") ? false : (stryCov_9fa48("2588", "2589"), hostname === (stryMutAct_9fa48("2590") ? "" : (stryCov_9fa48("2590"), '127.0.0.1')))) || (stryMutAct_9fa48("2592") ? hostname !== '::1' : stryMutAct_9fa48("2591") ? false : (stryCov_9fa48("2591", "2592"), hostname === (stryMutAct_9fa48("2593") ? "" : (stryCov_9fa48("2593"), '::1')))))) {
          if (stryMutAct_9fa48("2594")) {
            {}
          } else {
            stryCov_9fa48("2594");
            return stryMutAct_9fa48("2595") ? false : (stryCov_9fa48("2595"), true);
          }
        }
        return stryMutAct_9fa48("2596") ? true : (stryCov_9fa48("2596"), false);
      }
    } catch (error) {
      if (stryMutAct_9fa48("2597")) {
        {}
      } else {
        stryCov_9fa48("2597");
        // Origin inválida
        return stryMutAct_9fa48("2598") ? true : (stryCov_9fa48("2598"), false);
      }
    }
  }
}

/**
 * Configuração de CORS para rede interna
 */
const corsOptions: CorsOptions = stryMutAct_9fa48("2599") ? {} : (stryCov_9fa48("2599"), {
  origin: (origin, callback) => {
    if (stryMutAct_9fa48("2600")) {
      {}
    } else {
      stryCov_9fa48("2600");
      // Em desenvolvimento, permite qualquer origem se configurado
      if (stryMutAct_9fa48("2603") ? process.env.NODE_ENV === 'development' || process.env.CORS_ALLOW_ALL === 'true' : stryMutAct_9fa48("2602") ? false : stryMutAct_9fa48("2601") ? true : (stryCov_9fa48("2601", "2602", "2603"), (stryMutAct_9fa48("2605") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("2604") ? true : (stryCov_9fa48("2604", "2605"), process.env.NODE_ENV === (stryMutAct_9fa48("2606") ? "" : (stryCov_9fa48("2606"), 'development')))) && (stryMutAct_9fa48("2608") ? process.env.CORS_ALLOW_ALL !== 'true' : stryMutAct_9fa48("2607") ? true : (stryCov_9fa48("2607", "2608"), process.env.CORS_ALLOW_ALL === (stryMutAct_9fa48("2609") ? "" : (stryCov_9fa48("2609"), 'true')))))) {
        if (stryMutAct_9fa48("2610")) {
          {}
        } else {
          stryCov_9fa48("2610");
          callback(null, stryMutAct_9fa48("2611") ? false : (stryCov_9fa48("2611"), true));
          return;
        }
      }

      // Valida origem
      if (stryMutAct_9fa48("2613") ? false : stryMutAct_9fa48("2612") ? true : (stryCov_9fa48("2612", "2613"), isAllowedOrigin(origin))) {
        if (stryMutAct_9fa48("2614")) {
          {}
        } else {
          stryCov_9fa48("2614");
          callback(null, stryMutAct_9fa48("2615") ? false : (stryCov_9fa48("2615"), true));
        }
      } else {
        if (stryMutAct_9fa48("2616")) {
          {}
        } else {
          stryCov_9fa48("2616");
          // Não retorna o header CORS para origens não autorizadas
          callback(null, stryMutAct_9fa48("2617") ? true : (stryCov_9fa48("2617"), false));
        }
      }
    }
  },
  credentials: stryMutAct_9fa48("2618") ? false : (stryCov_9fa48("2618"), true),
  methods: stryMutAct_9fa48("2619") ? [] : (stryCov_9fa48("2619"), [stryMutAct_9fa48("2620") ? "" : (stryCov_9fa48("2620"), 'GET'), stryMutAct_9fa48("2621") ? "" : (stryCov_9fa48("2621"), 'POST'), stryMutAct_9fa48("2622") ? "" : (stryCov_9fa48("2622"), 'PUT'), stryMutAct_9fa48("2623") ? "" : (stryCov_9fa48("2623"), 'DELETE'), stryMutAct_9fa48("2624") ? "" : (stryCov_9fa48("2624"), 'PATCH'), stryMutAct_9fa48("2625") ? "" : (stryCov_9fa48("2625"), 'OPTIONS')]),
  allowedHeaders: stryMutAct_9fa48("2626") ? [] : (stryCov_9fa48("2626"), [stryMutAct_9fa48("2627") ? "" : (stryCov_9fa48("2627"), 'Content-Type'), stryMutAct_9fa48("2628") ? "" : (stryCov_9fa48("2628"), 'Authorization'), stryMutAct_9fa48("2629") ? "" : (stryCov_9fa48("2629"), 'X-Requested-With'), stryMutAct_9fa48("2630") ? "" : (stryCov_9fa48("2630"), 'Accept')]),
  exposedHeaders: stryMutAct_9fa48("2631") ? [] : (stryCov_9fa48("2631"), [stryMutAct_9fa48("2632") ? "" : (stryCov_9fa48("2632"), 'RateLimit-Limit'), stryMutAct_9fa48("2633") ? "" : (stryCov_9fa48("2633"), 'RateLimit-Remaining'), stryMutAct_9fa48("2634") ? "" : (stryCov_9fa48("2634"), 'RateLimit-Reset')]),
  maxAge: 86400
});

/**
 * Middleware que bloqueia requisições de origens não autorizadas
 */
export function corsOriginValidator(req: Request, res: Response, next: NextFunction) {
  if (stryMutAct_9fa48("2635")) {
    {}
  } else {
    stryCov_9fa48("2635");
    const origin = req.headers.origin;

    // Em desenvolvimento com CORS_ALLOW_ALL, pula validação
    if (stryMutAct_9fa48("2638") ? process.env.NODE_ENV === 'development' || process.env.CORS_ALLOW_ALL === 'true' : stryMutAct_9fa48("2637") ? false : stryMutAct_9fa48("2636") ? true : (stryCov_9fa48("2636", "2637", "2638"), (stryMutAct_9fa48("2640") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("2639") ? true : (stryCov_9fa48("2639", "2640"), process.env.NODE_ENV === (stryMutAct_9fa48("2641") ? "" : (stryCov_9fa48("2641"), 'development')))) && (stryMutAct_9fa48("2643") ? process.env.CORS_ALLOW_ALL !== 'true' : stryMutAct_9fa48("2642") ? true : (stryCov_9fa48("2642", "2643"), process.env.CORS_ALLOW_ALL === (stryMutAct_9fa48("2644") ? "" : (stryCov_9fa48("2644"), 'true')))))) {
      if (stryMutAct_9fa48("2645")) {
        {}
      } else {
        stryCov_9fa48("2645");
        return next();
      }
    }

    // Se tem origin e não é permitida, bloqueia
    if (stryMutAct_9fa48("2648") ? origin || !isAllowedOrigin(origin) : stryMutAct_9fa48("2647") ? false : stryMutAct_9fa48("2646") ? true : (stryCov_9fa48("2646", "2647", "2648"), origin && (stryMutAct_9fa48("2649") ? isAllowedOrigin(origin) : (stryCov_9fa48("2649"), !isAllowedOrigin(origin))))) {
      if (stryMutAct_9fa48("2650")) {
        {}
      } else {
        stryCov_9fa48("2650");
        console.warn(stryMutAct_9fa48("2651") ? `` : (stryCov_9fa48("2651"), `Requisição bloqueada - Origem não autorizada: ${origin}`));
        return res.status(403).json(stryMutAct_9fa48("2652") ? {} : (stryCov_9fa48("2652"), {
          success: stryMutAct_9fa48("2653") ? true : (stryCov_9fa48("2653"), false),
          error: stryMutAct_9fa48("2654") ? "" : (stryCov_9fa48("2654"), 'Acesso negado - Origem não autorizada')
        }));
      }
    }
    next();
  }
}

// Exporta o middleware CORS padrão
export const corsMiddleware = cors(corsOptions);