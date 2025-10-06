// @ts-nocheck
// src/config/configValidator.ts
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
import { config } from './env.config';
import { log } from '@shared/utils/logger';

/**
 * Valida configurações obrigatórias
 * Fail-fast: Se configuração inválida, app não deve iniciar
 */
export class ConfigValidator {
  private errors: string[] = stryMutAct_9fa48("627") ? ["Stryker was here"] : (stryCov_9fa48("627"), []);
  validate(): void {
    if (stryMutAct_9fa48("628")) {
      {}
    } else {
      stryCov_9fa48("628");
      this.validateServer();
      this.validateDatabase();
      this.validateCors();
      this.validateTimeouts();
      this.validateRetry();
      if (stryMutAct_9fa48("632") ? this.errors.length <= 0 : stryMutAct_9fa48("631") ? this.errors.length >= 0 : stryMutAct_9fa48("630") ? false : stryMutAct_9fa48("629") ? true : (stryCov_9fa48("629", "630", "631", "632"), this.errors.length > 0)) {
        if (stryMutAct_9fa48("633")) {
          {}
        } else {
          stryCov_9fa48("633");
          this.logErrors();
          throw new Error(stryMutAct_9fa48("634") ? `` : (stryCov_9fa48("634"), `❌ Configuração inválida. Corrija os erros no .env`));
        }
      }
      this.logSuccess();
    }
  }
  private validateServer(): void {
    if (stryMutAct_9fa48("635")) {
      {}
    } else {
      stryCov_9fa48("635");
      // Port
      if (stryMutAct_9fa48("638") ? (!config.server.port || config.server.port < 1) && config.server.port > 65535 : stryMutAct_9fa48("637") ? false : stryMutAct_9fa48("636") ? true : (stryCov_9fa48("636", "637", "638"), (stryMutAct_9fa48("640") ? !config.server.port && config.server.port < 1 : stryMutAct_9fa48("639") ? false : (stryCov_9fa48("639", "640"), (stryMutAct_9fa48("641") ? config.server.port : (stryCov_9fa48("641"), !config.server.port)) || (stryMutAct_9fa48("644") ? config.server.port >= 1 : stryMutAct_9fa48("643") ? config.server.port <= 1 : stryMutAct_9fa48("642") ? false : (stryCov_9fa48("642", "643", "644"), config.server.port < 1)))) || (stryMutAct_9fa48("647") ? config.server.port <= 65535 : stryMutAct_9fa48("646") ? config.server.port >= 65535 : stryMutAct_9fa48("645") ? false : (stryCov_9fa48("645", "646", "647"), config.server.port > 65535)))) {
        if (stryMutAct_9fa48("648")) {
          {}
        } else {
          stryCov_9fa48("648");
          this.errors.push(stryMutAct_9fa48("649") ? `` : (stryCov_9fa48("649"), `PORT inválida: ${config.server.port}. Deve estar entre 1 e 65535.`));
        }
      }

      // Node ENV
      const validEnvs = stryMutAct_9fa48("650") ? [] : (stryCov_9fa48("650"), [stryMutAct_9fa48("651") ? "" : (stryCov_9fa48("651"), 'development'), stryMutAct_9fa48("652") ? "" : (stryCov_9fa48("652"), 'production'), stryMutAct_9fa48("653") ? "" : (stryCov_9fa48("653"), 'test')]);
      if (stryMutAct_9fa48("656") ? false : stryMutAct_9fa48("655") ? true : stryMutAct_9fa48("654") ? validEnvs.includes(config.server.nodeEnv) : (stryCov_9fa48("654", "655", "656"), !validEnvs.includes(config.server.nodeEnv))) {
        if (stryMutAct_9fa48("657")) {
          {}
        } else {
          stryCov_9fa48("657");
          this.errors.push(stryMutAct_9fa48("658") ? `` : (stryCov_9fa48("658"), `NODE_ENV inválido: "${config.server.nodeEnv}". Valores válidos: ${validEnvs.join(stryMutAct_9fa48("659") ? "" : (stryCov_9fa48("659"), ', '))}`));
        }
      }

      // API Prefix
      if (stryMutAct_9fa48("662") ? !config.server.apiPrefix && !config.server.apiPrefix.startsWith('/') : stryMutAct_9fa48("661") ? false : stryMutAct_9fa48("660") ? true : (stryCov_9fa48("660", "661", "662"), (stryMutAct_9fa48("663") ? config.server.apiPrefix : (stryCov_9fa48("663"), !config.server.apiPrefix)) || (stryMutAct_9fa48("664") ? config.server.apiPrefix.startsWith('/') : (stryCov_9fa48("664"), !(stryMutAct_9fa48("665") ? config.server.apiPrefix.endsWith('/') : (stryCov_9fa48("665"), config.server.apiPrefix.startsWith(stryMutAct_9fa48("666") ? "" : (stryCov_9fa48("666"), '/')))))))) {
        if (stryMutAct_9fa48("667")) {
          {}
        } else {
          stryCov_9fa48("667");
          this.errors.push(stryMutAct_9fa48("668") ? `` : (stryCov_9fa48("668"), `API_PREFIX deve começar com "/". Atual: "${config.server.apiPrefix}"`));
        }
      }
    }
  }
  private validateDatabase(): void {
    if (stryMutAct_9fa48("669")) {
      {}
    } else {
      stryCov_9fa48("669");
      const {
        database
      } = config;

      // Connection Type
      if (stryMutAct_9fa48("672") ? database.type !== 'sqlserver' || database.type !== 'odbc' : stryMutAct_9fa48("671") ? false : stryMutAct_9fa48("670") ? true : (stryCov_9fa48("670", "671", "672"), (stryMutAct_9fa48("674") ? database.type === 'sqlserver' : stryMutAct_9fa48("673") ? true : (stryCov_9fa48("673", "674"), database.type !== (stryMutAct_9fa48("675") ? "" : (stryCov_9fa48("675"), 'sqlserver')))) && (stryMutAct_9fa48("677") ? database.type === 'odbc' : stryMutAct_9fa48("676") ? true : (stryCov_9fa48("676", "677"), database.type !== (stryMutAct_9fa48("678") ? "" : (stryCov_9fa48("678"), 'odbc')))))) {
        if (stryMutAct_9fa48("679")) {
          {}
        } else {
          stryCov_9fa48("679");
          this.errors.push(stryMutAct_9fa48("680") ? `` : (stryCov_9fa48("680"), `DB_CONNECTION_TYPE inválido: "${database.type}". Use "sqlserver" ou "odbc".`));
        }
      }

      // SQL Server validations
      if (stryMutAct_9fa48("683") ? database.type === 'sqlserver' || !database.useMockData : stryMutAct_9fa48("682") ? false : stryMutAct_9fa48("681") ? true : (stryCov_9fa48("681", "682", "683"), (stryMutAct_9fa48("685") ? database.type !== 'sqlserver' : stryMutAct_9fa48("684") ? true : (stryCov_9fa48("684", "685"), database.type === (stryMutAct_9fa48("686") ? "" : (stryCov_9fa48("686"), 'sqlserver')))) && (stryMutAct_9fa48("687") ? database.useMockData : (stryCov_9fa48("687"), !database.useMockData)))) {
        if (stryMutAct_9fa48("688")) {
          {}
        } else {
          stryCov_9fa48("688");
          this.validateSqlServer();
        }
      }

      // ODBC validations
      if (stryMutAct_9fa48("691") ? database.type === 'odbc' || !database.useMockData : stryMutAct_9fa48("690") ? false : stryMutAct_9fa48("689") ? true : (stryCov_9fa48("689", "690", "691"), (stryMutAct_9fa48("693") ? database.type !== 'odbc' : stryMutAct_9fa48("692") ? true : (stryCov_9fa48("692", "693"), database.type === (stryMutAct_9fa48("694") ? "" : (stryCov_9fa48("694"), 'odbc')))) && (stryMutAct_9fa48("695") ? database.useMockData : (stryCov_9fa48("695"), !database.useMockData)))) {
        if (stryMutAct_9fa48("696")) {
          {}
        } else {
          stryCov_9fa48("696");
          this.validateOdbc();
        }
      }
    }
  }
  private validateSqlServer(): void {
    if (stryMutAct_9fa48("697")) {
      {}
    } else {
      stryCov_9fa48("697");
      const {
        sqlServer
      } = config.database;
      if (stryMutAct_9fa48("700") ? false : stryMutAct_9fa48("699") ? true : stryMutAct_9fa48("698") ? sqlServer.server : (stryCov_9fa48("698", "699", "700"), !sqlServer.server)) {
        if (stryMutAct_9fa48("701")) {
          {}
        } else {
          stryCov_9fa48("701");
          this.errors.push(stryMutAct_9fa48("702") ? "" : (stryCov_9fa48("702"), 'DB_SERVER é obrigatório para SQL Server'));
        }
      }
      if (stryMutAct_9fa48("705") ? (!sqlServer.port || sqlServer.port < 1) && sqlServer.port > 65535 : stryMutAct_9fa48("704") ? false : stryMutAct_9fa48("703") ? true : (stryCov_9fa48("703", "704", "705"), (stryMutAct_9fa48("707") ? !sqlServer.port && sqlServer.port < 1 : stryMutAct_9fa48("706") ? false : (stryCov_9fa48("706", "707"), (stryMutAct_9fa48("708") ? sqlServer.port : (stryCov_9fa48("708"), !sqlServer.port)) || (stryMutAct_9fa48("711") ? sqlServer.port >= 1 : stryMutAct_9fa48("710") ? sqlServer.port <= 1 : stryMutAct_9fa48("709") ? false : (stryCov_9fa48("709", "710", "711"), sqlServer.port < 1)))) || (stryMutAct_9fa48("714") ? sqlServer.port <= 65535 : stryMutAct_9fa48("713") ? sqlServer.port >= 65535 : stryMutAct_9fa48("712") ? false : (stryCov_9fa48("712", "713", "714"), sqlServer.port > 65535)))) {
        if (stryMutAct_9fa48("715")) {
          {}
        } else {
          stryCov_9fa48("715");
          this.errors.push(stryMutAct_9fa48("716") ? `` : (stryCov_9fa48("716"), `DB_PORT inválida: ${sqlServer.port}`));
        }
      }
      if (stryMutAct_9fa48("719") ? false : stryMutAct_9fa48("718") ? true : stryMutAct_9fa48("717") ? sqlServer.user : (stryCov_9fa48("717", "718", "719"), !sqlServer.user)) {
        if (stryMutAct_9fa48("720")) {
          {}
        } else {
          stryCov_9fa48("720");
          this.errors.push(stryMutAct_9fa48("721") ? "" : (stryCov_9fa48("721"), 'DB_USER é obrigatório para SQL Server'));
        }
      }
      if (stryMutAct_9fa48("724") ? false : stryMutAct_9fa48("723") ? true : stryMutAct_9fa48("722") ? sqlServer.password : (stryCov_9fa48("722", "723", "724"), !sqlServer.password)) {
        if (stryMutAct_9fa48("725")) {
          {}
        } else {
          stryCov_9fa48("725");
          this.errors.push(stryMutAct_9fa48("726") ? "" : (stryCov_9fa48("726"), 'DB_PASSWORD é obrigatório para SQL Server'));
        }
      }

      // Database pode ser vazio (usa default do user)
      // Não validar databaseEmp e databaseMult

      // Timeouts
      if (stryMutAct_9fa48("730") ? sqlServer.connectionTimeout >= 1000 : stryMutAct_9fa48("729") ? sqlServer.connectionTimeout <= 1000 : stryMutAct_9fa48("728") ? false : stryMutAct_9fa48("727") ? true : (stryCov_9fa48("727", "728", "729", "730"), sqlServer.connectionTimeout < 1000)) {
        if (stryMutAct_9fa48("731")) {
          {}
        } else {
          stryCov_9fa48("731");
          this.errors.push(stryMutAct_9fa48("732") ? `` : (stryCov_9fa48("732"), `DB_CONNECTION_TIMEOUT muito baixo: ${sqlServer.connectionTimeout}ms. Mínimo: 1000ms`));
        }
      }
      if (stryMutAct_9fa48("736") ? sqlServer.requestTimeout >= 1000 : stryMutAct_9fa48("735") ? sqlServer.requestTimeout <= 1000 : stryMutAct_9fa48("734") ? false : stryMutAct_9fa48("733") ? true : (stryCov_9fa48("733", "734", "735", "736"), sqlServer.requestTimeout < 1000)) {
        if (stryMutAct_9fa48("737")) {
          {}
        } else {
          stryCov_9fa48("737");
          this.errors.push(stryMutAct_9fa48("738") ? `` : (stryCov_9fa48("738"), `DB_REQUEST_TIMEOUT muito baixo: ${sqlServer.requestTimeout}ms. Mínimo: 1000ms`));
        }
      }
    }
  }
  private validateOdbc(): void {
    if (stryMutAct_9fa48("739")) {
      {}
    } else {
      stryCov_9fa48("739");
      const {
        odbc
      } = config.database;
      if (stryMutAct_9fa48("742") ? false : stryMutAct_9fa48("741") ? true : stryMutAct_9fa48("740") ? odbc.dsnEmp : (stryCov_9fa48("740", "741", "742"), !odbc.dsnEmp)) {
        if (stryMutAct_9fa48("743")) {
          {}
        } else {
          stryCov_9fa48("743");
          this.errors.push(stryMutAct_9fa48("744") ? "" : (stryCov_9fa48("744"), 'ODBC_DSN_EMP é obrigatório para ODBC'));
        }
      }
      if (stryMutAct_9fa48("747") ? false : stryMutAct_9fa48("746") ? true : stryMutAct_9fa48("745") ? odbc.dsnMult : (stryCov_9fa48("745", "746", "747"), !odbc.dsnMult)) {
        if (stryMutAct_9fa48("748")) {
          {}
        } else {
          stryCov_9fa48("748");
          this.errors.push(stryMutAct_9fa48("749") ? "" : (stryCov_9fa48("749"), 'ODBC_DSN_MULT é obrigatório para ODBC'));
        }
      }
      if (stryMutAct_9fa48("753") ? odbc.connectionTimeout >= 1000 : stryMutAct_9fa48("752") ? odbc.connectionTimeout <= 1000 : stryMutAct_9fa48("751") ? false : stryMutAct_9fa48("750") ? true : (stryCov_9fa48("750", "751", "752", "753"), odbc.connectionTimeout < 1000)) {
        if (stryMutAct_9fa48("754")) {
          {}
        } else {
          stryCov_9fa48("754");
          this.errors.push(stryMutAct_9fa48("755") ? `` : (stryCov_9fa48("755"), `ODBC_CONNECTION_TIMEOUT muito baixo: ${odbc.connectionTimeout}ms. Mínimo: 1000ms`));
        }
      }
    }
  }
  private validateCors(): void {
    if (stryMutAct_9fa48("756")) {
      {}
    } else {
      stryCov_9fa48("756");
      if (stryMutAct_9fa48("759") ? !config.cors.allowedOrigins && config.cors.allowedOrigins.length === 0 : stryMutAct_9fa48("758") ? false : stryMutAct_9fa48("757") ? true : (stryCov_9fa48("757", "758", "759"), (stryMutAct_9fa48("760") ? config.cors.allowedOrigins : (stryCov_9fa48("760"), !config.cors.allowedOrigins)) || (stryMutAct_9fa48("762") ? config.cors.allowedOrigins.length !== 0 : stryMutAct_9fa48("761") ? false : (stryCov_9fa48("761", "762"), config.cors.allowedOrigins.length === 0)))) {
        if (stryMutAct_9fa48("763")) {
          {}
        } else {
          stryCov_9fa48("763");
          this.errors.push(stryMutAct_9fa48("764") ? "" : (stryCov_9fa48("764"), 'CORS_ALLOWED_ORIGINS não pode estar vazio'));
        }
      }

      // Validar formato de URL
      config.cors.allowedOrigins.forEach(origin => {
        if (stryMutAct_9fa48("765")) {
          {}
        } else {
          stryCov_9fa48("765");
          if (stryMutAct_9fa48("768") ? origin !== '*' && !origin.startsWith('http://') || !origin.startsWith('https://') : stryMutAct_9fa48("767") ? false : stryMutAct_9fa48("766") ? true : (stryCov_9fa48("766", "767", "768"), (stryMutAct_9fa48("770") ? origin !== '*' || !origin.startsWith('http://') : stryMutAct_9fa48("769") ? true : (stryCov_9fa48("769", "770"), (stryMutAct_9fa48("772") ? origin === '*' : stryMutAct_9fa48("771") ? true : (stryCov_9fa48("771", "772"), origin !== (stryMutAct_9fa48("773") ? "" : (stryCov_9fa48("773"), '*')))) && (stryMutAct_9fa48("774") ? origin.startsWith('http://') : (stryCov_9fa48("774"), !(stryMutAct_9fa48("775") ? origin.endsWith('http://') : (stryCov_9fa48("775"), origin.startsWith(stryMutAct_9fa48("776") ? "" : (stryCov_9fa48("776"), 'http://')))))))) && (stryMutAct_9fa48("777") ? origin.startsWith('https://') : (stryCov_9fa48("777"), !(stryMutAct_9fa48("778") ? origin.endsWith('https://') : (stryCov_9fa48("778"), origin.startsWith(stryMutAct_9fa48("779") ? "" : (stryCov_9fa48("779"), 'https://')))))))) {
            if (stryMutAct_9fa48("780")) {
              {}
            } else {
              stryCov_9fa48("780");
              this.errors.push(stryMutAct_9fa48("781") ? `` : (stryCov_9fa48("781"), `CORS origin inválido: "${origin}". Deve começar com http:// ou https://`));
            }
          }
        }
      });
    }
  }
  private validateTimeouts(): void {
    if (stryMutAct_9fa48("782")) {
      {}
    } else {
      stryCov_9fa48("782");
      const {
        timeout
      } = config;
      if (stryMutAct_9fa48("786") ? timeout.request >= 1000 : stryMutAct_9fa48("785") ? timeout.request <= 1000 : stryMutAct_9fa48("784") ? false : stryMutAct_9fa48("783") ? true : (stryCov_9fa48("783", "784", "785", "786"), timeout.request < 1000)) {
        if (stryMutAct_9fa48("787")) {
          {}
        } else {
          stryCov_9fa48("787");
          this.errors.push(stryMutAct_9fa48("788") ? `` : (stryCov_9fa48("788"), `HTTP_REQUEST_TIMEOUT muito baixo: ${timeout.request}ms. Mínimo: 1000ms`));
        }
      }
      if (stryMutAct_9fa48("792") ? timeout.healthCheck >= 100 : stryMutAct_9fa48("791") ? timeout.healthCheck <= 100 : stryMutAct_9fa48("790") ? false : stryMutAct_9fa48("789") ? true : (stryCov_9fa48("789", "790", "791", "792"), timeout.healthCheck < 100)) {
        if (stryMutAct_9fa48("793")) {
          {}
        } else {
          stryCov_9fa48("793");
          this.errors.push(stryMutAct_9fa48("794") ? `` : (stryCov_9fa48("794"), `HTTP_HEALTH_TIMEOUT muito baixo: ${timeout.healthCheck}ms. Mínimo: 100ms`));
        }
      }
      if (stryMutAct_9fa48("798") ? timeout.healthCheck <= timeout.request : stryMutAct_9fa48("797") ? timeout.healthCheck >= timeout.request : stryMutAct_9fa48("796") ? false : stryMutAct_9fa48("795") ? true : (stryCov_9fa48("795", "796", "797", "798"), timeout.healthCheck > timeout.request)) {
        if (stryMutAct_9fa48("799")) {
          {}
        } else {
          stryCov_9fa48("799");
          this.errors.push(stryMutAct_9fa48("800") ? `` : (stryCov_9fa48("800"), `HTTP_HEALTH_TIMEOUT (${timeout.healthCheck}ms) não pode ser maior que HTTP_REQUEST_TIMEOUT (${timeout.request}ms)`));
        }
      }
    }
  }
  private validateRetry(): void {
    if (stryMutAct_9fa48("801")) {
      {}
    } else {
      stryCov_9fa48("801");
      const {
        retry
      } = config.database;
      if (stryMutAct_9fa48("805") ? retry.maxAttempts >= 1 : stryMutAct_9fa48("804") ? retry.maxAttempts <= 1 : stryMutAct_9fa48("803") ? false : stryMutAct_9fa48("802") ? true : (stryCov_9fa48("802", "803", "804", "805"), retry.maxAttempts < 1)) {
        if (stryMutAct_9fa48("806")) {
          {}
        } else {
          stryCov_9fa48("806");
          this.errors.push(stryMutAct_9fa48("807") ? `` : (stryCov_9fa48("807"), `DB_RETRY_MAX_ATTEMPTS deve ser >= 1. Atual: ${retry.maxAttempts}`));
        }
      }
      if (stryMutAct_9fa48("811") ? retry.maxAttempts <= 10 : stryMutAct_9fa48("810") ? retry.maxAttempts >= 10 : stryMutAct_9fa48("809") ? false : stryMutAct_9fa48("808") ? true : (stryCov_9fa48("808", "809", "810", "811"), retry.maxAttempts > 10)) {
        if (stryMutAct_9fa48("812")) {
          {}
        } else {
          stryCov_9fa48("812");
          this.errors.push(stryMutAct_9fa48("813") ? `` : (stryCov_9fa48("813"), `DB_RETRY_MAX_ATTEMPTS muito alto: ${retry.maxAttempts}. Máximo recomendado: 10`));
        }
      }
      if (stryMutAct_9fa48("817") ? retry.initialDelay >= 100 : stryMutAct_9fa48("816") ? retry.initialDelay <= 100 : stryMutAct_9fa48("815") ? false : stryMutAct_9fa48("814") ? true : (stryCov_9fa48("814", "815", "816", "817"), retry.initialDelay < 100)) {
        if (stryMutAct_9fa48("818")) {
          {}
        } else {
          stryCov_9fa48("818");
          this.errors.push(stryMutAct_9fa48("819") ? `` : (stryCov_9fa48("819"), `DB_RETRY_INITIAL_DELAY muito baixo: ${retry.initialDelay}ms. Mínimo: 100ms`));
        }
      }
      if (stryMutAct_9fa48("823") ? retry.maxDelay >= retry.initialDelay : stryMutAct_9fa48("822") ? retry.maxDelay <= retry.initialDelay : stryMutAct_9fa48("821") ? false : stryMutAct_9fa48("820") ? true : (stryCov_9fa48("820", "821", "822", "823"), retry.maxDelay < retry.initialDelay)) {
        if (stryMutAct_9fa48("824")) {
          {}
        } else {
          stryCov_9fa48("824");
          this.errors.push(stryMutAct_9fa48("825") ? `` : (stryCov_9fa48("825"), `DB_RETRY_MAX_DELAY (${retry.maxDelay}ms) deve ser >= DB_RETRY_INITIAL_DELAY (${retry.initialDelay}ms)`));
        }
      }
      if (stryMutAct_9fa48("829") ? retry.backoffFactor >= 1 : stryMutAct_9fa48("828") ? retry.backoffFactor <= 1 : stryMutAct_9fa48("827") ? false : stryMutAct_9fa48("826") ? true : (stryCov_9fa48("826", "827", "828", "829"), retry.backoffFactor < 1)) {
        if (stryMutAct_9fa48("830")) {
          {}
        } else {
          stryCov_9fa48("830");
          this.errors.push(stryMutAct_9fa48("831") ? `` : (stryCov_9fa48("831"), `DB_RETRY_BACKOFF_FACTOR deve ser >= 1. Atual: ${retry.backoffFactor}`));
        }
      }
    }
  }
  private logErrors(): void {
    if (stryMutAct_9fa48("832")) {
      {}
    } else {
      stryCov_9fa48("832");
      console.error(stryMutAct_9fa48("833") ? "" : (stryCov_9fa48("833"), '\n❌ ERROS DE CONFIGURAÇÃO:\n'));
      this.errors.forEach((error, index) => {
        if (stryMutAct_9fa48("834")) {
          {}
        } else {
          stryCov_9fa48("834");
          console.error(stryMutAct_9fa48("835") ? `` : (stryCov_9fa48("835"), `   ${stryMutAct_9fa48("836") ? index - 1 : (stryCov_9fa48("836"), index + 1)}. ${error}`));
        }
      });
      console.error(stryMutAct_9fa48("837") ? "" : (stryCov_9fa48("837"), '\n'));
    }
  }
  private logSuccess(): void {
    if (stryMutAct_9fa48("838")) {
      {}
    } else {
      stryCov_9fa48("838");
      log.info(stryMutAct_9fa48("839") ? "" : (stryCov_9fa48("839"), '✅ Configurações válidas'));
      if (stryMutAct_9fa48("842") ? config.server.nodeEnv !== 'development' : stryMutAct_9fa48("841") ? false : stryMutAct_9fa48("840") ? true : (stryCov_9fa48("840", "841", "842"), config.server.nodeEnv === (stryMutAct_9fa48("843") ? "" : (stryCov_9fa48("843"), 'development')))) {
        if (stryMutAct_9fa48("844")) {
          {}
        } else {
          stryCov_9fa48("844");
          console.log(stryMutAct_9fa48("845") ? "" : (stryCov_9fa48("845"), '\n📋 Configuração Atual:'));
          console.log(stryMutAct_9fa48("846") ? `` : (stryCov_9fa48("846"), `   Ambiente: ${config.server.nodeEnv}`));
          console.log(stryMutAct_9fa48("847") ? `` : (stryCov_9fa48("847"), `   Porta: ${config.server.port}`));
          console.log(stryMutAct_9fa48("848") ? `` : (stryCov_9fa48("848"), `   API Prefix: ${config.server.apiPrefix}`));
          console.log(stryMutAct_9fa48("849") ? `` : (stryCov_9fa48("849"), `   Banco: ${stryMutAct_9fa48("850") ? config.database.type.toLowerCase() : (stryCov_9fa48("850"), config.database.type.toUpperCase())}`));
          console.log(stryMutAct_9fa48("851") ? `` : (stryCov_9fa48("851"), `   Mock Data: ${config.database.useMockData ? stryMutAct_9fa48("852") ? "" : (stryCov_9fa48("852"), 'SIM') : stryMutAct_9fa48("853") ? "" : (stryCov_9fa48("853"), 'NÃO')}`));
          console.log(stryMutAct_9fa48("854") ? `` : (stryCov_9fa48("854"), `   Cache: ${config.cache.strategy} (${config.cache.enabled ? stryMutAct_9fa48("855") ? "" : (stryCov_9fa48("855"), 'habilitado') : stryMutAct_9fa48("856") ? "" : (stryCov_9fa48("856"), 'desabilitado')})`));
          console.log(stryMutAct_9fa48("857") ? `` : (stryCov_9fa48("857"), `   Retry: ${config.database.retry.maxAttempts} tentativas\n`));
        }
      }
    }
  }
}

// Export singleton instance
export const configValidator = new ConfigValidator();