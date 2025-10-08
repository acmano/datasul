// @ts-nocheck
// src/shared/middlewares/cache.middleware.ts
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
import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';
import { log } from '@shared/utils/logger';
interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
}
export function cacheMiddleware(options: CacheOptions = {}) {
  if (stryMutAct_9fa48("2419")) {
    {}
  } else {
    stryCov_9fa48("2419");
    const ttl = stryMutAct_9fa48("2422") ? options.ttl && 300 : stryMutAct_9fa48("2421") ? false : stryMutAct_9fa48("2420") ? true : (stryCov_9fa48("2420", "2421", "2422"), options.ttl || 300);
    return async (req: Request, res: Response, next: NextFunction) => {
      if (stryMutAct_9fa48("2423")) {
        {}
      } else {
        stryCov_9fa48("2423");
        if (stryMutAct_9fa48("2426") ? req.method === 'GET' : stryMutAct_9fa48("2425") ? false : stryMutAct_9fa48("2424") ? true : (stryCov_9fa48("2424", "2425", "2426"), req.method !== (stryMutAct_9fa48("2427") ? "" : (stryCov_9fa48("2427"), 'GET')))) {
          if (stryMutAct_9fa48("2428")) {
            {}
          } else {
            stryCov_9fa48("2428");
            return next();
          }
        }
        const cacheKey = options.keyGenerator ? options.keyGenerator(req) : generateDefaultCacheKey(req);

        // ✅ CORRIGIDO: Adicionar await
        const cachedResponse = await CacheManager.get<CachedResponse>(cacheKey);
        if (stryMutAct_9fa48("2430") ? false : stryMutAct_9fa48("2429") ? true : (stryCov_9fa48("2429", "2430"), cachedResponse)) {
          if (stryMutAct_9fa48("2431")) {
            {}
          } else {
            stryCov_9fa48("2431");
            log.debug(stryMutAct_9fa48("2432") ? "" : (stryCov_9fa48("2432"), 'Cache HTTP HIT'), stryMutAct_9fa48("2433") ? {} : (stryCov_9fa48("2433"), {
              correlationId: req.id,
              cacheKey,
              url: req.url
            }));
            res.setHeader(stryMutAct_9fa48("2434") ? "" : (stryCov_9fa48("2434"), 'X-Cache'), stryMutAct_9fa48("2435") ? "" : (stryCov_9fa48("2435"), 'HIT'));
            res.setHeader(stryMutAct_9fa48("2436") ? "" : (stryCov_9fa48("2436"), 'X-Cache-Key'), cacheKey);
            return res.status(cachedResponse.statusCode).set(cachedResponse.headers).json(cachedResponse.body);
          }
        }
        log.debug(stryMutAct_9fa48("2437") ? "" : (stryCov_9fa48("2437"), 'Cache HTTP MISS'), stryMutAct_9fa48("2438") ? {} : (stryCov_9fa48("2438"), {
          correlationId: req.id,
          cacheKey,
          url: req.url
        }));
        const originalJson = res.json.bind(res);
        res.json = function (body: any): Response {
          if (stryMutAct_9fa48("2439")) {
            {}
          } else {
            stryCov_9fa48("2439");
            const shouldCache = options.condition ? options.condition(req, res) : stryMutAct_9fa48("2442") ? res.statusCode !== 200 : stryMutAct_9fa48("2441") ? false : stryMutAct_9fa48("2440") ? true : (stryCov_9fa48("2440", "2441", "2442"), res.statusCode === 200);
            if (stryMutAct_9fa48("2444") ? false : stryMutAct_9fa48("2443") ? true : (stryCov_9fa48("2443", "2444"), shouldCache)) {
              if (stryMutAct_9fa48("2445")) {
                {}
              } else {
                stryCov_9fa48("2445");
                const cachedResponse: CachedResponse = stryMutAct_9fa48("2446") ? {} : (stryCov_9fa48("2446"), {
                  statusCode: res.statusCode,
                  headers: getRelevantHeaders(res),
                  body
                });

                // ✅ CORRIGIDO: Adicionar await (mas como não é async, usar then)
                CacheManager.set(cacheKey, cachedResponse, ttl).then(() => {
                  if (stryMutAct_9fa48("2447")) {
                    {}
                  } else {
                    stryCov_9fa48("2447");
                    log.debug(stryMutAct_9fa48("2448") ? "" : (stryCov_9fa48("2448"), 'Cache HTTP STORED'), stryMutAct_9fa48("2449") ? {} : (stryCov_9fa48("2449"), {
                      correlationId: req.id,
                      cacheKey,
                      ttl,
                      statusCode: res.statusCode
                    }));
                  }
                }).catch(err => {
                  if (stryMutAct_9fa48("2450")) {
                    {}
                  } else {
                    stryCov_9fa48("2450");
                    log.error(stryMutAct_9fa48("2451") ? "" : (stryCov_9fa48("2451"), 'Erro ao armazenar cache'), stryMutAct_9fa48("2452") ? {} : (stryCov_9fa48("2452"), {
                      error: err
                    }));
                  }
                });
              }
            }
            res.setHeader(stryMutAct_9fa48("2453") ? "" : (stryCov_9fa48("2453"), 'X-Cache'), stryMutAct_9fa48("2454") ? "" : (stryCov_9fa48("2454"), 'MISS'));
            res.setHeader(stryMutAct_9fa48("2455") ? "" : (stryCov_9fa48("2455"), 'X-Cache-Key'), cacheKey);
            return originalJson(body);
          }
        };
        next();
      }
    };
  }
}
function generateDefaultCacheKey(req: Request): string {
  if (stryMutAct_9fa48("2456")) {
    {}
  } else {
    stryCov_9fa48("2456");
    const {
      method,
      path,
      query
    } = req;
    const sortedQuery = stryMutAct_9fa48("2457") ? Object.keys(query).map(key => `${key}=${query[key]}`).join('&') : (stryCov_9fa48("2457"), Object.keys(query).sort().map(stryMutAct_9fa48("2458") ? () => undefined : (stryCov_9fa48("2458"), key => stryMutAct_9fa48("2459") ? `` : (stryCov_9fa48("2459"), `${key}=${query[key]}`))).join(stryMutAct_9fa48("2460") ? "" : (stryCov_9fa48("2460"), '&')));
    const parts = stryMutAct_9fa48("2461") ? [] : (stryCov_9fa48("2461"), [method, path]);
    if (stryMutAct_9fa48("2463") ? false : stryMutAct_9fa48("2462") ? true : (stryCov_9fa48("2462", "2463"), sortedQuery)) {
      if (stryMutAct_9fa48("2464")) {
        {}
      } else {
        stryCov_9fa48("2464");
        parts.push(sortedQuery);
      }
    }
    return generateCacheKey(...parts);
  }
}
function getRelevantHeaders(res: Response): Record<string, string> {
  if (stryMutAct_9fa48("2465")) {
    {}
  } else {
    stryCov_9fa48("2465");
    const relevantHeaders: Record<string, string> = {};
    const headersToPreserve = stryMutAct_9fa48("2466") ? [] : (stryCov_9fa48("2466"), [stryMutAct_9fa48("2467") ? "" : (stryCov_9fa48("2467"), 'content-type'), stryMutAct_9fa48("2468") ? "" : (stryCov_9fa48("2468"), 'content-encoding'), stryMutAct_9fa48("2469") ? "" : (stryCov_9fa48("2469"), 'x-correlation-id')]);
    headersToPreserve.forEach(header => {
      if (stryMutAct_9fa48("2470")) {
        {}
      } else {
        stryCov_9fa48("2470");
        const value = res.getHeader(header);
        if (stryMutAct_9fa48("2472") ? false : stryMutAct_9fa48("2471") ? true : (stryCov_9fa48("2471", "2472"), value)) {
          if (stryMutAct_9fa48("2473")) {
            {}
          } else {
            stryCov_9fa48("2473");
            relevantHeaders[header] = String(value);
          }
        }
      }
    });
    return relevantHeaders;
  }
}
interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}
export function invalidateCacheMiddleware(pattern: string | ((req: Request) => string)) {
  if (stryMutAct_9fa48("2474")) {
    {}
  } else {
    stryCov_9fa48("2474");
    return (req: Request, res: Response, next: NextFunction) => {
      if (stryMutAct_9fa48("2475")) {
        {}
      } else {
        stryCov_9fa48("2475");
        res.on(stryMutAct_9fa48("2476") ? "" : (stryCov_9fa48("2476"), 'finish'), async () => {
          if (stryMutAct_9fa48("2477")) {
            {}
          } else {
            stryCov_9fa48("2477");
            if (stryMutAct_9fa48("2480") ? res.statusCode >= 200 || res.statusCode < 300 : stryMutAct_9fa48("2479") ? false : stryMutAct_9fa48("2478") ? true : (stryCov_9fa48("2478", "2479", "2480"), (stryMutAct_9fa48("2483") ? res.statusCode < 200 : stryMutAct_9fa48("2482") ? res.statusCode > 200 : stryMutAct_9fa48("2481") ? true : (stryCov_9fa48("2481", "2482", "2483"), res.statusCode >= 200)) && (stryMutAct_9fa48("2486") ? res.statusCode >= 300 : stryMutAct_9fa48("2485") ? res.statusCode <= 300 : stryMutAct_9fa48("2484") ? true : (stryCov_9fa48("2484", "2485", "2486"), res.statusCode < 300)))) {
              if (stryMutAct_9fa48("2487")) {
                {}
              } else {
                stryCov_9fa48("2487");
                const cachePattern = (stryMutAct_9fa48("2490") ? typeof pattern !== 'function' : stryMutAct_9fa48("2489") ? false : stryMutAct_9fa48("2488") ? true : (stryCov_9fa48("2488", "2489", "2490"), typeof pattern === (stryMutAct_9fa48("2491") ? "" : (stryCov_9fa48("2491"), 'function')))) ? pattern(req) : pattern;

                // ✅ CORRIGIDO: Adicionar await
                const removed = await CacheManager.invalidate(cachePattern);
                if (stryMutAct_9fa48("2495") ? removed <= 0 : stryMutAct_9fa48("2494") ? removed >= 0 : stryMutAct_9fa48("2493") ? false : stryMutAct_9fa48("2492") ? true : (stryCov_9fa48("2492", "2493", "2494", "2495"), removed > 0)) {
                  if (stryMutAct_9fa48("2496")) {
                    {}
                  } else {
                    stryCov_9fa48("2496");
                    log.info(stryMutAct_9fa48("2497") ? "" : (stryCov_9fa48("2497"), 'Cache invalidado por mutation'), stryMutAct_9fa48("2498") ? {} : (stryCov_9fa48("2498"), {
                      correlationId: req.id,
                      pattern: cachePattern,
                      removed,
                      method: req.method,
                      url: req.url
                    }));
                  }
                }
              }
            }
          }
        });
        next();
      }
    };
  }
}