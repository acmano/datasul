// @ts-nocheck
// src/infrastructure/metrics/helpers/databaseMetrics.ts
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
import { metricsManager } from '../MetricsManager';
export type DatabaseType = 'EMP' | 'MULT';
export type QueryOperation = 'select' | 'insert' | 'update' | 'delete' | 'other';

/**
 * Helper para instrumentar queries e coletar métricas de banco de dados
 */
export class DatabaseMetricsHelper {
  /**
   * Detecta o tipo de operação SQL
   */
  private static detectOperation(sql: string): QueryOperation {
    if (stryMutAct_9fa48("2090")) {
      {}
    } else {
      stryCov_9fa48("2090");
      const normalizedSql = stryMutAct_9fa48("2092") ? sql.toUpperCase() : stryMutAct_9fa48("2091") ? sql.trim().toLowerCase() : (stryCov_9fa48("2091", "2092"), sql.trim().toUpperCase());
      if (stryMutAct_9fa48("2095") ? normalizedSql.endsWith('SELECT') : stryMutAct_9fa48("2094") ? false : stryMutAct_9fa48("2093") ? true : (stryCov_9fa48("2093", "2094", "2095"), normalizedSql.startsWith(stryMutAct_9fa48("2096") ? "" : (stryCov_9fa48("2096"), 'SELECT')))) return stryMutAct_9fa48("2097") ? "" : (stryCov_9fa48("2097"), 'select');
      if (stryMutAct_9fa48("2100") ? normalizedSql.endsWith('INSERT') : stryMutAct_9fa48("2099") ? false : stryMutAct_9fa48("2098") ? true : (stryCov_9fa48("2098", "2099", "2100"), normalizedSql.startsWith(stryMutAct_9fa48("2101") ? "" : (stryCov_9fa48("2101"), 'INSERT')))) return stryMutAct_9fa48("2102") ? "" : (stryCov_9fa48("2102"), 'insert');
      if (stryMutAct_9fa48("2105") ? normalizedSql.endsWith('UPDATE') : stryMutAct_9fa48("2104") ? false : stryMutAct_9fa48("2103") ? true : (stryCov_9fa48("2103", "2104", "2105"), normalizedSql.startsWith(stryMutAct_9fa48("2106") ? "" : (stryCov_9fa48("2106"), 'UPDATE')))) return stryMutAct_9fa48("2107") ? "" : (stryCov_9fa48("2107"), 'update');
      if (stryMutAct_9fa48("2110") ? normalizedSql.endsWith('DELETE') : stryMutAct_9fa48("2109") ? false : stryMutAct_9fa48("2108") ? true : (stryCov_9fa48("2108", "2109", "2110"), normalizedSql.startsWith(stryMutAct_9fa48("2111") ? "" : (stryCov_9fa48("2111"), 'DELETE')))) return stryMutAct_9fa48("2112") ? "" : (stryCov_9fa48("2112"), 'delete');
      return stryMutAct_9fa48("2113") ? "" : (stryCov_9fa48("2113"), 'other');
    }
  }

  /**
   * Executa uma query e coleta métricas automaticamente
   */
  static async instrumentQuery<T>(database: DatabaseType, sql: string, queryFn: () => Promise<T>): Promise<T> {
    if (stryMutAct_9fa48("2114")) {
      {}
    } else {
      stryCov_9fa48("2114");
      const operation = this.detectOperation(sql);
      const startTime = Date.now();

      // Incrementa queries em progresso
      metricsManager.dbQueriesInProgress.inc(stryMutAct_9fa48("2115") ? {} : (stryCov_9fa48("2115"), {
        database
      }));
      try {
        if (stryMutAct_9fa48("2116")) {
          {}
        } else {
          stryCov_9fa48("2116");
          const result = await queryFn();

          // Sucesso - registra métricas
          const duration = stryMutAct_9fa48("2117") ? (Date.now() - startTime) * 1000 : (stryCov_9fa48("2117"), (stryMutAct_9fa48("2118") ? Date.now() + startTime : (stryCov_9fa48("2118"), Date.now() - startTime)) / 1000); // segundos

          metricsManager.dbQueriesTotal.inc(stryMutAct_9fa48("2119") ? {} : (stryCov_9fa48("2119"), {
            database,
            operation
          }));
          metricsManager.dbQueryDuration.observe(stryMutAct_9fa48("2120") ? {} : (stryCov_9fa48("2120"), {
            database,
            operation
          }), duration);
          return result;
        }
      } catch (error) {
        if (stryMutAct_9fa48("2121")) {
          {}
        } else {
          stryCov_9fa48("2121");
          // Erro - registra métrica de erro
          const errorType = this.classifyError(error);
          metricsManager.dbQueryErrors.inc(stryMutAct_9fa48("2122") ? {} : (stryCov_9fa48("2122"), {
            database,
            error_type: errorType
          }));
          throw error;
        }
      } finally {
        if (stryMutAct_9fa48("2123")) {
          {}
        } else {
          stryCov_9fa48("2123");
          // Decrementa queries em progresso
          metricsManager.dbQueriesInProgress.dec(stryMutAct_9fa48("2124") ? {} : (stryCov_9fa48("2124"), {
            database
          }));
        }
      }
    }
  }

  /**
   * Classifica o tipo de erro
   */
  private static classifyError(error: any): string {
    if (stryMutAct_9fa48("2125")) {
      {}
    } else {
      stryCov_9fa48("2125");
      const message = stryMutAct_9fa48("2128") ? error?.message?.toLowerCase() && '' : stryMutAct_9fa48("2127") ? false : stryMutAct_9fa48("2126") ? true : (stryCov_9fa48("2126", "2127", "2128"), (stryMutAct_9fa48("2131") ? error.message?.toLowerCase() : stryMutAct_9fa48("2130") ? error?.message.toLowerCase() : stryMutAct_9fa48("2129") ? error?.message?.toUpperCase() : (stryCov_9fa48("2129", "2130", "2131"), error?.message?.toLowerCase())) || (stryMutAct_9fa48("2132") ? "Stryker was here!" : (stryCov_9fa48("2132"), '')));
      if (stryMutAct_9fa48("2134") ? false : stryMutAct_9fa48("2133") ? true : (stryCov_9fa48("2133", "2134"), message.includes(stryMutAct_9fa48("2135") ? "" : (stryCov_9fa48("2135"), 'timeout')))) return stryMutAct_9fa48("2136") ? "" : (stryCov_9fa48("2136"), 'timeout');
      if (stryMutAct_9fa48("2138") ? false : stryMutAct_9fa48("2137") ? true : (stryCov_9fa48("2137", "2138"), message.includes(stryMutAct_9fa48("2139") ? "" : (stryCov_9fa48("2139"), 'connection')))) return stryMutAct_9fa48("2140") ? "" : (stryCov_9fa48("2140"), 'connection');
      if (stryMutAct_9fa48("2142") ? false : stryMutAct_9fa48("2141") ? true : (stryCov_9fa48("2141", "2142"), message.includes(stryMutAct_9fa48("2143") ? "" : (stryCov_9fa48("2143"), 'syntax')))) return stryMutAct_9fa48("2144") ? "" : (stryCov_9fa48("2144"), 'syntax');
      if (stryMutAct_9fa48("2147") ? message.includes('permission') && message.includes('denied') : stryMutAct_9fa48("2146") ? false : stryMutAct_9fa48("2145") ? true : (stryCov_9fa48("2145", "2146", "2147"), message.includes(stryMutAct_9fa48("2148") ? "" : (stryCov_9fa48("2148"), 'permission')) || message.includes(stryMutAct_9fa48("2149") ? "" : (stryCov_9fa48("2149"), 'denied')))) return stryMutAct_9fa48("2150") ? "" : (stryCov_9fa48("2150"), 'permission');
      if (stryMutAct_9fa48("2152") ? false : stryMutAct_9fa48("2151") ? true : (stryCov_9fa48("2151", "2152"), message.includes(stryMutAct_9fa48("2153") ? "" : (stryCov_9fa48("2153"), 'deadlock')))) return stryMutAct_9fa48("2154") ? "" : (stryCov_9fa48("2154"), 'deadlock');
      return stryMutAct_9fa48("2155") ? "" : (stryCov_9fa48("2155"), 'unknown');
    }
  }

  /**
   * Registra erro de conexão
   */
  static recordConnectionError(database: DatabaseType, error: any): void {
    if (stryMutAct_9fa48("2156")) {
      {}
    } else {
      stryCov_9fa48("2156");
      const errorType = this.classifyError(error);
      metricsManager.dbConnectionErrors.inc(stryMutAct_9fa48("2157") ? {} : (stryCov_9fa48("2157"), {
        database,
        error_type: errorType
      }));
    }
  }

  /**
   * Atualiza o gauge de conexões ativas
   */
  static setActiveConnections(database: DatabaseType, count: number): void {
    if (stryMutAct_9fa48("2158")) {
      {}
    } else {
      stryCov_9fa48("2158");
      metricsManager.dbConnectionsActive.set(stryMutAct_9fa48("2159") ? {} : (stryCov_9fa48("2159"), {
        database
      }), count);
    }
  }
}