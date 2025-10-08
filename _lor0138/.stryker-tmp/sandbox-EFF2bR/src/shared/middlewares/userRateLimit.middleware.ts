// @ts-nocheck
// src/shared/middlewares/userRateLimit.middleware.ts
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
import { UserRateLimiter } from '@shared/utils/UserRateLimiter';
import { RateLimitError } from '@shared/errors';
import { UserTier } from '@shared/types/apiKey.types';
import { log } from '@shared/utils/logger';

/**
 * Middleware de rate limiting por usuário
 * Requer que apiKeyAuth middleware seja executado antes
 */
export function userRateLimit(req: Request, res: Response, next: NextFunction): void {
  if (stryMutAct_9fa48("2949")) {
    {}
  } else {
    stryCov_9fa48("2949");
    try {
      if (stryMutAct_9fa48("2950")) {
        {}
      } else {
        stryCov_9fa48("2950");
        // Se não há usuário autenticado, aplica rate limit genérico por IP
        if (stryMutAct_9fa48("2953") ? false : stryMutAct_9fa48("2952") ? true : stryMutAct_9fa48("2951") ? req.user : (stryCov_9fa48("2951", "2952", "2953"), !req.user)) {
          if (stryMutAct_9fa48("2954")) {
            {}
          } else {
            stryCov_9fa48("2954");
            log.debug(stryMutAct_9fa48("2955") ? "" : (stryCov_9fa48("2955"), 'Rate limit por IP (sem autenticação)'), stryMutAct_9fa48("2956") ? {} : (stryCov_9fa48("2956"), {
              correlationId: req.id,
              ip: req.ip
            }));
            // Fallback para rate limit genérico
            return next();
          }
        }
        const {
          id: userId,
          tier
        } = req.user;

        // Verifica rate limit
        const result = UserRateLimiter.check(userId, tier);

        // Adiciona headers de rate limit
        res.setHeader(stryMutAct_9fa48("2957") ? "" : (stryCov_9fa48("2957"), 'X-RateLimit-Limit'), result.limit.toString());
        res.setHeader(stryMutAct_9fa48("2958") ? "" : (stryCov_9fa48("2958"), 'X-RateLimit-Remaining'), result.remaining.toString());
        res.setHeader(stryMutAct_9fa48("2959") ? "" : (stryCov_9fa48("2959"), 'X-RateLimit-Reset'), new Date(result.resetAt).toISOString());
        if (stryMutAct_9fa48("2962") ? false : stryMutAct_9fa48("2961") ? true : stryMutAct_9fa48("2960") ? result.allowed : (stryCov_9fa48("2960", "2961", "2962"), !result.allowed)) {
          if (stryMutAct_9fa48("2963")) {
            {}
          } else {
            stryCov_9fa48("2963");
            // Rate limit excedido
            log.warn(stryMutAct_9fa48("2964") ? "" : (stryCov_9fa48("2964"), 'Rate limit por usuário excedido'), stryMutAct_9fa48("2965") ? {} : (stryCov_9fa48("2965"), {
              correlationId: req.id,
              userId,
              tier,
              limit: result.limit,
              resetAt: new Date(result.resetAt)
            }));

            // Adiciona header Retry-After
            if (stryMutAct_9fa48("2967") ? false : stryMutAct_9fa48("2966") ? true : (stryCov_9fa48("2966", "2967"), result.retryAfter)) {
              if (stryMutAct_9fa48("2968")) {
                {}
              } else {
                stryCov_9fa48("2968");
                res.setHeader(stryMutAct_9fa48("2969") ? "" : (stryCov_9fa48("2969"), 'Retry-After'), result.retryAfter.toString());
              }
            }
            throw new RateLimitError(result.retryAfter);
          }
        }
        log.debug(stryMutAct_9fa48("2970") ? "" : (stryCov_9fa48("2970"), 'Rate limit OK'), stryMutAct_9fa48("2971") ? {} : (stryCov_9fa48("2971"), {
          correlationId: req.id,
          userId,
          tier,
          remaining: result.remaining,
          limit: result.limit
        }));
        next();
      }
    } catch (error) {
      if (stryMutAct_9fa48("2972")) {
        {}
      } else {
        stryCov_9fa48("2972");
        next(error);
      }
    }
  }
}

/**
 * Cria middleware de rate limit customizado para endpoints específicos
 */
export function createUserRateLimit(options?: {
  skipAuthenticated?: boolean; // Pula rate limit se autenticado
  multiplier?: number; // Multiplica os limites padrão
}): (req: Request, res: Response, next: NextFunction) => void {
  if (stryMutAct_9fa48("2973")) {
    {}
  } else {
    stryCov_9fa48("2973");
    return (req: Request, res: Response, next: NextFunction) => {
      if (stryMutAct_9fa48("2974")) {
        {}
      } else {
        stryCov_9fa48("2974");
        try {
          if (stryMutAct_9fa48("2975")) {
            {}
          } else {
            stryCov_9fa48("2975");
            // Se configurado para pular autenticados e usuário está autenticado
            if (stryMutAct_9fa48("2978") ? options?.skipAuthenticated || req.user : stryMutAct_9fa48("2977") ? false : stryMutAct_9fa48("2976") ? true : (stryCov_9fa48("2976", "2977", "2978"), (stryMutAct_9fa48("2979") ? options.skipAuthenticated : (stryCov_9fa48("2979"), options?.skipAuthenticated)) && req.user)) {
              if (stryMutAct_9fa48("2980")) {
                {}
              } else {
                stryCov_9fa48("2980");
                return next();
              }
            }
            if (stryMutAct_9fa48("2983") ? false : stryMutAct_9fa48("2982") ? true : stryMutAct_9fa48("2981") ? req.user : (stryCov_9fa48("2981", "2982", "2983"), !req.user)) {
              if (stryMutAct_9fa48("2984")) {
                {}
              } else {
                stryCov_9fa48("2984");
                return next();
              }
            }
            const {
              id: userId,
              tier
            } = req.user;
            const result = UserRateLimiter.check(userId, tier);

            // Aplica multiplicador se configurado
            const limit = (stryMutAct_9fa48("2985") ? options.multiplier : (stryCov_9fa48("2985"), options?.multiplier)) ? stryMutAct_9fa48("2986") ? result.limit / options.multiplier : (stryCov_9fa48("2986"), result.limit * options.multiplier) : result.limit;
            res.setHeader(stryMutAct_9fa48("2987") ? "" : (stryCov_9fa48("2987"), 'X-RateLimit-Limit'), limit.toString());
            res.setHeader(stryMutAct_9fa48("2988") ? "" : (stryCov_9fa48("2988"), 'X-RateLimit-Remaining'), result.remaining.toString());
            res.setHeader(stryMutAct_9fa48("2989") ? "" : (stryCov_9fa48("2989"), 'X-RateLimit-Reset'), new Date(result.resetAt).toISOString());
            if (stryMutAct_9fa48("2992") ? false : stryMutAct_9fa48("2991") ? true : stryMutAct_9fa48("2990") ? result.allowed : (stryCov_9fa48("2990", "2991", "2992"), !result.allowed)) {
              if (stryMutAct_9fa48("2993")) {
                {}
              } else {
                stryCov_9fa48("2993");
                if (stryMutAct_9fa48("2995") ? false : stryMutAct_9fa48("2994") ? true : (stryCov_9fa48("2994", "2995"), result.retryAfter)) {
                  if (stryMutAct_9fa48("2996")) {
                    {}
                  } else {
                    stryCov_9fa48("2996");
                    res.setHeader(stryMutAct_9fa48("2997") ? "" : (stryCov_9fa48("2997"), 'Retry-After'), result.retryAfter.toString());
                  }
                }
                throw new RateLimitError(result.retryAfter);
              }
            }
            next();
          }
        } catch (error) {
          if (stryMutAct_9fa48("2998")) {
            {}
          } else {
            stryCov_9fa48("2998");
            next(error);
          }
        }
      }
    };
  }
}