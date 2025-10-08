// @ts-nocheck
// src/config/env.config.ts
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
import dotenv from 'dotenv';
import { appConfig } from './app.config';
dotenv.config();

/**
 * Parse de string de timeout para milissegundos
 * Aceita formatos: "30s", "5000ms", "5m", "5000"
 *
 * IMPORTANTE: Esta função é usada em TODO o projeto.
 * Garante que timeouts sempre sejam números válidos em ms.
 *
 * Formatos suportados:
 * - "30000" → 30000ms (número puro)
 * - "30s" → 30000ms (segundos)
 * - "30000ms" → 30000ms (milissegundos)
 * - "5m" → 300000ms (minutos)
 */
export function parseTimeout(value: string | undefined, defaultValue: number): number {
  if (stryMutAct_9fa48("858")) {
    {}
  } else {
    stryCov_9fa48("858");
    if (stryMutAct_9fa48("861") ? false : stryMutAct_9fa48("860") ? true : stryMutAct_9fa48("859") ? value : (stryCov_9fa48("859", "860", "861"), !value)) return defaultValue;

    // Se for número puro, retorna direto
    if (stryMutAct_9fa48("863") ? false : stryMutAct_9fa48("862") ? true : (stryCov_9fa48("862", "863"), (stryMutAct_9fa48("867") ? /^\D+$/ : stryMutAct_9fa48("866") ? /^\d$/ : stryMutAct_9fa48("865") ? /^\d+/ : stryMutAct_9fa48("864") ? /\d+$/ : (stryCov_9fa48("864", "865", "866", "867"), /^\d+$/)).test(value))) {
      if (stryMutAct_9fa48("868")) {
        {}
      } else {
        stryCov_9fa48("868");
        return parseInt(value, 10);
      }
    }

    // ✅ IMPORTANTE: Verificar 'ms' ANTES de 's'
    // (porque 'ms' também termina com 's')
    if (stryMutAct_9fa48("871") ? value.startsWith('ms') : stryMutAct_9fa48("870") ? false : stryMutAct_9fa48("869") ? true : (stryCov_9fa48("869", "870", "871"), value.endsWith(stryMutAct_9fa48("872") ? "" : (stryCov_9fa48("872"), 'ms')))) {
      if (stryMutAct_9fa48("873")) {
        {}
      } else {
        stryCov_9fa48("873");
        return parseInt(stryMutAct_9fa48("874") ? value : (stryCov_9fa48("874"), value.slice(0, stryMutAct_9fa48("875") ? +2 : (stryCov_9fa48("875"), -2))), 10);
      }
    }

    // Se terminar com 's', converte segundos para ms
    if (stryMutAct_9fa48("878") ? value.startsWith('s') : stryMutAct_9fa48("877") ? false : stryMutAct_9fa48("876") ? true : (stryCov_9fa48("876", "877", "878"), value.endsWith(stryMutAct_9fa48("879") ? "" : (stryCov_9fa48("879"), 's')))) {
      if (stryMutAct_9fa48("880")) {
        {}
      } else {
        stryCov_9fa48("880");
        return stryMutAct_9fa48("881") ? parseInt(value.slice(0, -1), 10) / 1000 : (stryCov_9fa48("881"), parseInt(stryMutAct_9fa48("882") ? value : (stryCov_9fa48("882"), value.slice(0, stryMutAct_9fa48("883") ? +1 : (stryCov_9fa48("883"), -1))), 10) * 1000);
      }
    }

    // Se terminar com 'm', converte minutos para ms
    if (stryMutAct_9fa48("886") ? value.startsWith('m') : stryMutAct_9fa48("885") ? false : stryMutAct_9fa48("884") ? true : (stryCov_9fa48("884", "885", "886"), value.endsWith(stryMutAct_9fa48("887") ? "" : (stryCov_9fa48("887"), 'm')))) {
      if (stryMutAct_9fa48("888")) {
        {}
      } else {
        stryCov_9fa48("888");
        return stryMutAct_9fa48("889") ? parseInt(value.slice(0, -1), 10) / 60000 : (stryCov_9fa48("889"), parseInt(stryMutAct_9fa48("890") ? value : (stryCov_9fa48("890"), value.slice(0, stryMutAct_9fa48("891") ? +1 : (stryCov_9fa48("891"), -1))), 10) * 60000);
      }
    }
    return defaultValue;
  }
}

// ============================================
// CONFIGURAÇÃO CENTRALIZADA
// ============================================

export const config = stryMutAct_9fa48("892") ? {} : (stryCov_9fa48("892"), {
  // ==================== SERVIDOR ====================
  server: stryMutAct_9fa48("893") ? {} : (stryCov_9fa48("893"), {
    port: parseInt(stryMutAct_9fa48("896") ? process.env.PORT && '3000' : stryMutAct_9fa48("895") ? false : stryMutAct_9fa48("894") ? true : (stryCov_9fa48("894", "895", "896"), process.env.PORT || (stryMutAct_9fa48("897") ? "" : (stryCov_9fa48("897"), '3000'))), 10),
    nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    apiPrefix: stryMutAct_9fa48("900") ? process.env.API_PREFIX && '/api' : stryMutAct_9fa48("899") ? false : stryMutAct_9fa48("898") ? true : (stryCov_9fa48("898", "899", "900"), process.env.API_PREFIX || (stryMutAct_9fa48("901") ? "" : (stryCov_9fa48("901"), '/api')))
  }),
  // ==================== BANCO DE DADOS ====================
  database: stryMutAct_9fa48("902") ? {} : (stryCov_9fa48("902"), {
    // Tipo de conexão
    type: (process.env.DB_CONNECTION_TYPE || 'sqlserver') as 'sqlserver' | 'odbc',
    useMockData: stryMutAct_9fa48("905") ? process.env.USE_MOCK_DATA !== 'true' : stryMutAct_9fa48("904") ? false : stryMutAct_9fa48("903") ? true : (stryCov_9fa48("903", "904", "905"), process.env.USE_MOCK_DATA === (stryMutAct_9fa48("906") ? "" : (stryCov_9fa48("906"), 'true'))),
    // SQL Server (usado pelo DatabaseManager)
    sqlServer: stryMutAct_9fa48("907") ? {} : (stryCov_9fa48("907"), {
      server: stryMutAct_9fa48("910") ? process.env.DB_SERVER && appConfig.host : stryMutAct_9fa48("909") ? false : stryMutAct_9fa48("908") ? true : (stryCov_9fa48("908", "909", "910"), process.env.DB_SERVER || appConfig.host),
      port: parseInt(stryMutAct_9fa48("913") ? process.env.DB_PORT && '1433' : stryMutAct_9fa48("912") ? false : stryMutAct_9fa48("911") ? true : (stryCov_9fa48("911", "912", "913"), process.env.DB_PORT || (stryMutAct_9fa48("914") ? "" : (stryCov_9fa48("914"), '1433'))), 10),
      user: stryMutAct_9fa48("917") ? process.env.DB_USER && '' : stryMutAct_9fa48("916") ? false : stryMutAct_9fa48("915") ? true : (stryCov_9fa48("915", "916", "917"), process.env.DB_USER || (stryMutAct_9fa48("918") ? "Stryker was here!" : (stryCov_9fa48("918"), ''))),
      password: stryMutAct_9fa48("921") ? process.env.DB_PASSWORD && '' : stryMutAct_9fa48("920") ? false : stryMutAct_9fa48("919") ? true : (stryCov_9fa48("919", "920", "921"), process.env.DB_PASSWORD || (stryMutAct_9fa48("922") ? "Stryker was here!" : (stryCov_9fa48("922"), ''))),
      // ✅ CORRETO: Usa DB_DATABASE_* (não DB_NAME_*)
      databaseEmp: stryMutAct_9fa48("925") ? process.env.DB_DATABASE_EMP && '' : stryMutAct_9fa48("924") ? false : stryMutAct_9fa48("923") ? true : (stryCov_9fa48("923", "924", "925"), process.env.DB_DATABASE_EMP || (stryMutAct_9fa48("926") ? "Stryker was here!" : (stryCov_9fa48("926"), ''))),
      databaseMult: stryMutAct_9fa48("929") ? process.env.DB_DATABASE_MULT && '' : stryMutAct_9fa48("928") ? false : stryMutAct_9fa48("927") ? true : (stryCov_9fa48("927", "928", "929"), process.env.DB_DATABASE_MULT || (stryMutAct_9fa48("930") ? "Stryker was here!" : (stryCov_9fa48("930"), ''))),
      // ✅ CORRETO: Usa parseTimeout para TODOS os timeouts
      connectionTimeout: parseTimeout(process.env.DB_CONNECTION_TIMEOUT, 15000),
      requestTimeout: parseTimeout(process.env.DB_REQUEST_TIMEOUT, 30000),
      encrypt: stryMutAct_9fa48("933") ? process.env.DB_ENCRYPT !== 'true' : stryMutAct_9fa48("932") ? false : stryMutAct_9fa48("931") ? true : (stryCov_9fa48("931", "932", "933"), process.env.DB_ENCRYPT === (stryMutAct_9fa48("934") ? "" : (stryCov_9fa48("934"), 'true'))),
      trustServerCertificate: stryMutAct_9fa48("937") ? process.env.DB_TRUST_SERVER_CERTIFICATE !== 'true' : stryMutAct_9fa48("936") ? false : stryMutAct_9fa48("935") ? true : (stryCov_9fa48("935", "936", "937"), process.env.DB_TRUST_SERVER_CERTIFICATE === (stryMutAct_9fa48("938") ? "" : (stryCov_9fa48("938"), 'true')))
    }),
    // ODBC
    odbc: stryMutAct_9fa48("939") ? {} : (stryCov_9fa48("939"), {
      dsnEmp: stryMutAct_9fa48("942") ? process.env.ODBC_DSN_EMP && '' : stryMutAct_9fa48("941") ? false : stryMutAct_9fa48("940") ? true : (stryCov_9fa48("940", "941", "942"), process.env.ODBC_DSN_EMP || (stryMutAct_9fa48("943") ? "Stryker was here!" : (stryCov_9fa48("943"), ''))),
      dsnMult: stryMutAct_9fa48("946") ? process.env.ODBC_DSN_MULT && '' : stryMutAct_9fa48("945") ? false : stryMutAct_9fa48("944") ? true : (stryCov_9fa48("944", "945", "946"), process.env.ODBC_DSN_MULT || (stryMutAct_9fa48("947") ? "Stryker was here!" : (stryCov_9fa48("947"), ''))),
      connectionTimeout: parseTimeout(process.env.ODBC_CONNECTION_TIMEOUT, 15000)
    }),
    // Retry
    retry: stryMutAct_9fa48("948") ? {} : (stryCov_9fa48("948"), {
      maxAttempts: parseInt(stryMutAct_9fa48("951") ? process.env.DB_RETRY_MAX_ATTEMPTS && '3' : stryMutAct_9fa48("950") ? false : stryMutAct_9fa48("949") ? true : (stryCov_9fa48("949", "950", "951"), process.env.DB_RETRY_MAX_ATTEMPTS || (stryMutAct_9fa48("952") ? "" : (stryCov_9fa48("952"), '3'))), 10),
      initialDelay: parseTimeout(process.env.DB_RETRY_INITIAL_DELAY, 1000),
      maxDelay: parseTimeout(process.env.DB_RETRY_MAX_DELAY, 10000),
      backoffFactor: parseFloat(stryMutAct_9fa48("955") ? process.env.DB_RETRY_BACKOFF_FACTOR && '2' : stryMutAct_9fa48("954") ? false : stryMutAct_9fa48("953") ? true : (stryCov_9fa48("953", "954", "955"), process.env.DB_RETRY_BACKOFF_FACTOR || (stryMutAct_9fa48("956") ? "" : (stryCov_9fa48("956"), '2'))))
    })
  }),
  // ==================== CORS ====================
  cors: stryMutAct_9fa48("957") ? {} : (stryCov_9fa48("957"), {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(stryMutAct_9fa48("958") ? "" : (stryCov_9fa48("958"), ',')) : stryMutAct_9fa48("959") ? [] : (stryCov_9fa48("959"), [appConfig.baseUrl])
  }),
  // ==================== TIMEOUTS HTTP ====================
  timeout: stryMutAct_9fa48("960") ? {} : (stryCov_9fa48("960"), {
    request: parseTimeout(process.env.HTTP_REQUEST_TIMEOUT, 30000),
    heavyOperation: parseTimeout(process.env.HTTP_HEAVY_TIMEOUT, 60000),
    healthCheck: parseTimeout(process.env.HTTP_HEALTH_TIMEOUT, 5000)
  }),
  // ==================== CACHE (Redis) ====================
  cache: stryMutAct_9fa48("961") ? {} : (stryCov_9fa48("961"), {
    enabled: stryMutAct_9fa48("964") ? process.env.CACHE_ENABLED !== 'true' : stryMutAct_9fa48("963") ? false : stryMutAct_9fa48("962") ? true : (stryCov_9fa48("962", "963", "964"), process.env.CACHE_ENABLED === (stryMutAct_9fa48("965") ? "" : (stryCov_9fa48("965"), 'true'))),
    strategy: (process.env.CACHE_STRATEGY || 'memory') as 'memory' | 'redis' | 'layered',
    redis: stryMutAct_9fa48("966") ? {} : (stryCov_9fa48("966"), {
      url: stryMutAct_9fa48("969") ? process.env.CACHE_REDIS_URL && 'redis://lor0138.lorenzetti.ibe:6379' : stryMutAct_9fa48("968") ? false : stryMutAct_9fa48("967") ? true : (stryCov_9fa48("967", "968", "969"), process.env.CACHE_REDIS_URL || (stryMutAct_9fa48("970") ? "" : (stryCov_9fa48("970"), 'redis://lor0138.lorenzetti.ibe:6379')))
    }),
    defaultTTL: parseTimeout(process.env.CACHE_DEFAULT_TTL, 300000) // 5min padrão
  })
});

// ============================================
// EXPORTS COMPATÍVEIS (não quebra código existente)
// ============================================

/**
 * @deprecated Use 'config' ao invés de 'envConfig'
 */
export const envConfig = config;

/**
 * @deprecated Use 'config.server' diretamente
 */
export const serverConfig = stryMutAct_9fa48("971") ? {} : (stryCov_9fa48("971"), {
  port: config.server.port,
  nodeEnv: config.server.nodeEnv,
  apiPrefix: config.server.apiPrefix,
  corsOrigin: stryMutAct_9fa48("974") ? config.cors.allowedOrigins[0] && '*' : stryMutAct_9fa48("973") ? false : stryMutAct_9fa48("972") ? true : (stryCov_9fa48("972", "973", "974"), config.cors.allowedOrigins[0] || (stryMutAct_9fa48("975") ? "" : (stryCov_9fa48("975"), '*')))
});