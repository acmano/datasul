// @ts-nocheck
// src/shared/errors/CustomErrors.ts
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
import { AppError } from './AppError';

/**
 * Erro quando item não é encontrado
 */
export class ItemNotFoundError extends AppError {
  constructor(itemCodigo: string) {
    if (stryMutAct_9fa48("2313")) {
      {}
    } else {
      stryCov_9fa48("2313");
      super(404, stryMutAct_9fa48("2314") ? `` : (stryCov_9fa48("2314"), `Item ${itemCodigo} não encontrado`), stryMutAct_9fa48("2315") ? false : (stryCov_9fa48("2315"), true), stryMutAct_9fa48("2316") ? {} : (stryCov_9fa48("2316"), {
        itemCodigo
      }));
    }
  }
}

/**
 * Erro quando estabelecimento não é encontrado
 */
export class EstabelecimentoNotFoundError extends AppError {
  constructor(estabCodigo: string) {
    if (stryMutAct_9fa48("2317")) {
      {}
    } else {
      stryCov_9fa48("2317");
      super(404, stryMutAct_9fa48("2318") ? `` : (stryCov_9fa48("2318"), `Estabelecimento ${estabCodigo} não encontrado`), stryMutAct_9fa48("2319") ? false : (stryCov_9fa48("2319"), true), stryMutAct_9fa48("2320") ? {} : (stryCov_9fa48("2320"), {
        estabCodigo
      }));
    }
  }
}

/**
 * Erro de validação de dados
 */
export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    if (stryMutAct_9fa48("2321")) {
      {}
    } else {
      stryCov_9fa48("2321");
      super(400, message, stryMutAct_9fa48("2322") ? false : (stryCov_9fa48("2322"), true), stryMutAct_9fa48("2323") ? {} : (stryCov_9fa48("2323"), {
        fields
      }));
    }
  }
}

/**
 * Erro de banco de dados
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    if (stryMutAct_9fa48("2324")) {
      {}
    } else {
      stryCov_9fa48("2324");
      super(500, stryMutAct_9fa48("2325") ? `` : (stryCov_9fa48("2325"), `Erro no banco de dados: ${message}`), stryMutAct_9fa48("2326") ? false : (stryCov_9fa48("2326"), true), stryMutAct_9fa48("2327") ? {} : (stryCov_9fa48("2327"), {
        originalMessage: stryMutAct_9fa48("2328") ? originalError.message : (stryCov_9fa48("2328"), originalError?.message),
        ...(stryMutAct_9fa48("2331") ? process.env.NODE_ENV === 'development' || {
          stack: originalError?.stack
        } : stryMutAct_9fa48("2330") ? false : stryMutAct_9fa48("2329") ? true : (stryCov_9fa48("2329", "2330", "2331"), (stryMutAct_9fa48("2333") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("2332") ? true : (stryCov_9fa48("2332", "2333"), process.env.NODE_ENV === (stryMutAct_9fa48("2334") ? "" : (stryCov_9fa48("2334"), 'development')))) && (stryMutAct_9fa48("2335") ? {} : (stryCov_9fa48("2335"), {
          stack: stryMutAct_9fa48("2336") ? originalError.stack : (stryCov_9fa48("2336"), originalError?.stack)
        }))))
      }));
    }
  }
}

/**
 * Erro de timeout de conexão
 */
export class ConnectionTimeoutError extends AppError {
  constructor(service: string, timeout: number) {
    if (stryMutAct_9fa48("2337")) {
      {}
    } else {
      stryCov_9fa48("2337");
      super(503, stryMutAct_9fa48("2338") ? `` : (stryCov_9fa48("2338"), `Timeout ao conectar com ${service} após ${timeout}ms`), stryMutAct_9fa48("2339") ? false : (stryCov_9fa48("2339"), true), stryMutAct_9fa48("2340") ? {} : (stryCov_9fa48("2340"), {
        service,
        timeout
      }));
    }
  }
}

/**
 * Erro de conexão com serviço externo
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    if (stryMutAct_9fa48("2341")) {
      {}
    } else {
      stryCov_9fa48("2341");
      super(503, stryMutAct_9fa48("2342") ? `` : (stryCov_9fa48("2342"), `Erro no serviço ${service}: ${message}`), stryMutAct_9fa48("2343") ? false : (stryCov_9fa48("2343"), true), stryMutAct_9fa48("2344") ? {} : (stryCov_9fa48("2344"), {
        service
      }));
    }
  }
}

/**
 * Erro de cache
 */
export class CacheError extends AppError {
  constructor(operation: string, message: string) {
    if (stryMutAct_9fa48("2345")) {
      {}
    } else {
      stryCov_9fa48("2345");
      super(500, stryMutAct_9fa48("2346") ? `` : (stryCov_9fa48("2346"), `Erro no cache (${operation}): ${message}`), stryMutAct_9fa48("2347") ? false : (stryCov_9fa48("2347"), true), stryMutAct_9fa48("2348") ? {} : (stryCov_9fa48("2348"), {
        operation
      }));
    }
  }
}

/**
 * Erro de autenticação
 */
export class AuthenticationError extends AppError {
  constructor(message: string = stryMutAct_9fa48("2349") ? "" : (stryCov_9fa48("2349"), 'Não autenticado')) {
    if (stryMutAct_9fa48("2350")) {
      {}
    } else {
      stryCov_9fa48("2350");
      super(401, message, stryMutAct_9fa48("2351") ? false : (stryCov_9fa48("2351"), true));
    }
  }
}

/**
 * Erro de autorização
 */
export class AuthorizationError extends AppError {
  constructor(message: string = stryMutAct_9fa48("2352") ? "" : (stryCov_9fa48("2352"), 'Não autorizado')) {
    if (stryMutAct_9fa48("2353")) {
      {}
    } else {
      stryCov_9fa48("2353");
      super(403, message, stryMutAct_9fa48("2354") ? false : (stryCov_9fa48("2354"), true));
    }
  }
}

/**
 * Erro de rate limit
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    if (stryMutAct_9fa48("2355")) {
      {}
    } else {
      stryCov_9fa48("2355");
      super(429, stryMutAct_9fa48("2356") ? "" : (stryCov_9fa48("2356"), 'Muitas requisições. Tente novamente em alguns segundos.'), stryMutAct_9fa48("2357") ? false : (stryCov_9fa48("2357"), true), stryMutAct_9fa48("2358") ? {} : (stryCov_9fa48("2358"), {
        retryAfter
      }));
    }
  }
}

/**
 * Erro de configuração
 */
export class ConfigurationError extends AppError {
  constructor(message: string) {
    if (stryMutAct_9fa48("2359")) {
      {}
    } else {
      stryCov_9fa48("2359");
      super(500, stryMutAct_9fa48("2360") ? `` : (stryCov_9fa48("2360"), `Erro de configuração: ${message}`), stryMutAct_9fa48("2361") ? true : (stryCov_9fa48("2361"), false));
    }
  }
}

/**
 * Erro de business rule
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, rule?: string) {
    if (stryMutAct_9fa48("2362")) {
      {}
    } else {
      stryCov_9fa48("2362");
      super(422, message, stryMutAct_9fa48("2363") ? false : (stryCov_9fa48("2363"), true), stryMutAct_9fa48("2364") ? {} : (stryCov_9fa48("2364"), {
        rule
      }));
    }
  }
}