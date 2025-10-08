// @ts-nocheck
// src/shared/middlewares/apiKeyAuth.middleware.ts
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
import { ApiKeyService } from '@shared/services/ApiKeyService';
import { AuthenticationError } from '@shared/errors';
import { log } from '@shared/utils/logger';

/**
 * Middleware de autenticação por API Key
 * 
 * Aceita API Key via:
 * - Header: X-API-Key
 * - Header: Authorization: Bearer <api-key>
 * - Query: ?api_key=<api-key>
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (stryMutAct_9fa48("2365")) {
    {}
  } else {
    stryCov_9fa48("2365");
    try {
      if (stryMutAct_9fa48("2366")) {
        {}
      } else {
        stryCov_9fa48("2366");
        // Extrai API Key de múltiplas fontes
        const apiKey = extractApiKey(req);
        if (stryMutAct_9fa48("2369") ? false : stryMutAct_9fa48("2368") ? true : stryMutAct_9fa48("2367") ? apiKey : (stryCov_9fa48("2367", "2368", "2369"), !apiKey)) {
          if (stryMutAct_9fa48("2370")) {
            {}
          } else {
            stryCov_9fa48("2370");
            throw new AuthenticationError(stryMutAct_9fa48("2371") ? "" : (stryCov_9fa48("2371"), 'API Key não fornecida. Forneça via header X-API-Key ou Authorization: Bearer <key>'));
          }
        }

        // Valida API Key
        const keyConfig = await ApiKeyService.validateKey(apiKey);
        if (stryMutAct_9fa48("2374") ? false : stryMutAct_9fa48("2373") ? true : stryMutAct_9fa48("2372") ? keyConfig : (stryCov_9fa48("2372", "2373", "2374"), !keyConfig)) {
          if (stryMutAct_9fa48("2375")) {
            {}
          } else {
            stryCov_9fa48("2375");
            throw new AuthenticationError(stryMutAct_9fa48("2376") ? `` : (stryCov_9fa48("2376"), `API Key inválida ou expirada: ${maskApiKey(apiKey)}`));
          }
        }

        // Adiciona informações do usuário ao request
        req.apiKey = keyConfig;
        req.user = stryMutAct_9fa48("2377") ? {} : (stryCov_9fa48("2377"), {
          id: keyConfig.userId,
          name: keyConfig.userName,
          tier: keyConfig.tier
        });
        log.debug(stryMutAct_9fa48("2378") ? "" : (stryCov_9fa48("2378"), 'Autenticação via API Key'), stryMutAct_9fa48("2379") ? {} : (stryCov_9fa48("2379"), {
          correlationId: req.id,
          userId: keyConfig.userId,
          tier: keyConfig.tier,
          apiKey: maskApiKey(apiKey)
        }));
        next();
      }
    } catch (error) {
      if (stryMutAct_9fa48("2380")) {
        {}
      } else {
        stryCov_9fa48("2380");
        next(error);
      }
    }
  }
}

/**
 * Middleware de autenticação opcional
 * Se API Key fornecida, valida. Se não, continua sem autenticação.
 */
export async function optionalApiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (stryMutAct_9fa48("2381")) {
    {}
  } else {
    stryCov_9fa48("2381");
    const apiKey = extractApiKey(req);
    if (stryMutAct_9fa48("2384") ? false : stryMutAct_9fa48("2383") ? true : stryMutAct_9fa48("2382") ? apiKey : (stryCov_9fa48("2382", "2383", "2384"), !apiKey)) {
      if (stryMutAct_9fa48("2385")) {
        {}
      } else {
        stryCov_9fa48("2385");
        // Sem API Key, continua sem autenticação
        return next();
      }
    }
    try {
      if (stryMutAct_9fa48("2386")) {
        {}
      } else {
        stryCov_9fa48("2386");
        const keyConfig = await ApiKeyService.validateKey(apiKey);
        if (stryMutAct_9fa48("2388") ? false : stryMutAct_9fa48("2387") ? true : (stryCov_9fa48("2387", "2388"), keyConfig)) {
          if (stryMutAct_9fa48("2389")) {
            {}
          } else {
            stryCov_9fa48("2389");
            req.apiKey = keyConfig;
            req.user = stryMutAct_9fa48("2390") ? {} : (stryCov_9fa48("2390"), {
              id: keyConfig.userId,
              name: keyConfig.userName,
              tier: keyConfig.tier
            });
            log.debug(stryMutAct_9fa48("2391") ? "" : (stryCov_9fa48("2391"), 'Autenticação opcional via API Key'), stryMutAct_9fa48("2392") ? {} : (stryCov_9fa48("2392"), {
              correlationId: req.id,
              userId: keyConfig.userId,
              tier: keyConfig.tier
            }));
          }
        }
        next();
      }
    } catch (error) {
      if (stryMutAct_9fa48("2393")) {
        {}
      } else {
        stryCov_9fa48("2393");
        // Ignora erros de autenticação no modo opcional
        next();
      }
    }
  }
}

/**
 * Extrai API Key do request
 */
function extractApiKey(req: Request): string | null {
  if (stryMutAct_9fa48("2394")) {
    {}
  } else {
    stryCov_9fa48("2394");
    // 1. Header X-API-Key
    const headerKey = req.headers['x-api-key'] as string;
    if (stryMutAct_9fa48("2396") ? false : stryMutAct_9fa48("2395") ? true : (stryCov_9fa48("2395", "2396"), headerKey)) {
      if (stryMutAct_9fa48("2397")) {
        {}
      } else {
        stryCov_9fa48("2397");
        return headerKey;
      }
    }

    // 2. Header Authorization: Bearer
    const authHeader = req.headers['authorization'] as string;
    if (stryMutAct_9fa48("2400") ? authHeader || authHeader.startsWith('Bearer ') : stryMutAct_9fa48("2399") ? false : stryMutAct_9fa48("2398") ? true : (stryCov_9fa48("2398", "2399", "2400"), authHeader && (stryMutAct_9fa48("2401") ? authHeader.endsWith('Bearer ') : (stryCov_9fa48("2401"), authHeader.startsWith(stryMutAct_9fa48("2402") ? "" : (stryCov_9fa48("2402"), 'Bearer ')))))) {
      if (stryMutAct_9fa48("2403")) {
        {}
      } else {
        stryCov_9fa48("2403");
        return stryMutAct_9fa48("2404") ? authHeader : (stryCov_9fa48("2404"), authHeader.substring(7));
      }
    }

    // 3. Query parameter
    const queryKey = req.query.api_key as string;
    if (stryMutAct_9fa48("2406") ? false : stryMutAct_9fa48("2405") ? true : (stryCov_9fa48("2405", "2406"), queryKey)) {
      if (stryMutAct_9fa48("2407")) {
        {}
      } else {
        stryCov_9fa48("2407");
        return queryKey;
      }
    }
    return null;
  }
}

/**
 * Mascara API Key para logs
 */
function maskApiKey(apiKey: string): string {
  if (stryMutAct_9fa48("2408")) {
    {}
  } else {
    stryCov_9fa48("2408");
    if (stryMutAct_9fa48("2412") ? apiKey.length > 8 : stryMutAct_9fa48("2411") ? apiKey.length < 8 : stryMutAct_9fa48("2410") ? false : stryMutAct_9fa48("2409") ? true : (stryCov_9fa48("2409", "2410", "2411", "2412"), apiKey.length <= 8)) {
      if (stryMutAct_9fa48("2413")) {
        {}
      } else {
        stryCov_9fa48("2413");
        return stryMutAct_9fa48("2414") ? "" : (stryCov_9fa48("2414"), '***');
      }
    }
    return stryMutAct_9fa48("2415") ? `` : (stryCov_9fa48("2415"), `${stryMutAct_9fa48("2416") ? apiKey : (stryCov_9fa48("2416"), apiKey.substring(0, 4))}...${stryMutAct_9fa48("2417") ? apiKey : (stryCov_9fa48("2417"), apiKey.substring(stryMutAct_9fa48("2418") ? apiKey.length + 4 : (stryCov_9fa48("2418"), apiKey.length - 4)))}`);
  }
}