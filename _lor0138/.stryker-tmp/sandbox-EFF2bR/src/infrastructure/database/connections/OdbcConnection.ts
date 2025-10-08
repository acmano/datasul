// @ts-nocheck
// src/infrastructure/database/connections/OdbcConnection.ts
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
import odbc from 'odbc';
import { IConnection, QueryParameter } from '../types';
import { log } from '@shared/utils/logger';
import { retryWithBackoff, isRetryableError } from '@shared/utils/retry';
import { config } from '@config/env.config';
export class OdbcConnection implements IConnection {
  private connection: odbc.Connection | null = null;
  private connectionString: string;
  private name: string;
  constructor(connectionString: string, name: string = stryMutAct_9fa48("1536") ? "" : (stryCov_9fa48("1536"), 'ODBC')) {
    if (stryMutAct_9fa48("1537")) {
      {}
    } else {
      stryCov_9fa48("1537");
      this.connectionString = connectionString;
      this.name = name;
    }
  }
  async connect(): Promise<void> {
    if (stryMutAct_9fa48("1538")) {
      {}
    } else {
      stryCov_9fa48("1538");
      const context = stryMutAct_9fa48("1539") ? `` : (stryCov_9fa48("1539"), `${this.name} (ODBC)`);
      log.info(stryMutAct_9fa48("1540") ? `` : (stryCov_9fa48("1540"), `Conectando ${context}...`));

      // ✅ NOVO: Retry com backoff exponencial
      const retryOptions = stryMutAct_9fa48("1541") ? {} : (stryCov_9fa48("1541"), {
        maxAttempts: config.database.retry.maxAttempts,
        initialDelay: config.database.retry.initialDelay,
        maxDelay: config.database.retry.maxDelay,
        backoffFactor: config.database.retry.backoffFactor,
        jitter: stryMutAct_9fa48("1542") ? false : (stryCov_9fa48("1542"), true),
        onRetry: (error: Error, attempt: number, delay: number) => {
          if (stryMutAct_9fa48("1543")) {
            {}
          } else {
            stryCov_9fa48("1543");
            // Só retry em erros de conexão
            if (stryMutAct_9fa48("1546") ? false : stryMutAct_9fa48("1545") ? true : stryMutAct_9fa48("1544") ? isRetryableError(error) : (stryCov_9fa48("1544", "1545", "1546"), !isRetryableError(error))) {
              if (stryMutAct_9fa48("1547")) {
                {}
              } else {
                stryCov_9fa48("1547");
                log.error(stryMutAct_9fa48("1548") ? `` : (stryCov_9fa48("1548"), `${context}: Erro não-retryable, abortando`), stryMutAct_9fa48("1549") ? {} : (stryCov_9fa48("1549"), {
                  error: error.message,
                  attempt
                }));
                throw error;
              }
            }
          }
        }
      });
      try {
        if (stryMutAct_9fa48("1550")) {
          {}
        } else {
          stryCov_9fa48("1550");
          this.connection = await retryWithBackoff(async () => {
            if (stryMutAct_9fa48("1551")) {
              {}
            } else {
              stryCov_9fa48("1551");
              const conn = await odbc.connect(this.connectionString);
              return conn;
            }
          }, retryOptions, context);
          log.info(stryMutAct_9fa48("1552") ? `` : (stryCov_9fa48("1552"), `${context} conectado`));
        }
      } catch (error) {
        if (stryMutAct_9fa48("1553")) {
          {}
        } else {
          stryCov_9fa48("1553");
          log.error(stryMutAct_9fa48("1554") ? `` : (stryCov_9fa48("1554"), `${context}: Falha após todas as tentativas de retry`), stryMutAct_9fa48("1555") ? {} : (stryCov_9fa48("1555"), {
            error: error instanceof Error ? error.message : stryMutAct_9fa48("1556") ? "" : (stryCov_9fa48("1556"), 'Erro desconhecido'),
            maxAttempts: retryOptions.maxAttempts
          }));
          throw error;
        }
      }
    }
  }
  async query(sql: string): Promise<any> {
    if (stryMutAct_9fa48("1557")) {
      {}
    } else {
      stryCov_9fa48("1557");
      if (stryMutAct_9fa48("1560") ? false : stryMutAct_9fa48("1559") ? true : stryMutAct_9fa48("1558") ? this.connection : (stryCov_9fa48("1558", "1559", "1560"), !this.connection)) {
        if (stryMutAct_9fa48("1561")) {
          {}
        } else {
          stryCov_9fa48("1561");
          throw new Error(stryMutAct_9fa48("1562") ? `` : (stryCov_9fa48("1562"), `${this.name}: Conexão não inicializada`));
        }
      }
      try {
        if (stryMutAct_9fa48("1563")) {
          {}
        } else {
          stryCov_9fa48("1563");
          const result = await this.connection.query(sql);
          return result;
        }
      } catch (error) {
        if (stryMutAct_9fa48("1564")) {
          {}
        } else {
          stryCov_9fa48("1564");
          log.error(stryMutAct_9fa48("1565") ? `` : (stryCov_9fa48("1565"), `${this.name}: Erro na query`), stryMutAct_9fa48("1566") ? {} : (stryCov_9fa48("1566"), {
            error: error instanceof Error ? error.message : stryMutAct_9fa48("1567") ? "" : (stryCov_9fa48("1567"), 'Erro desconhecido'),
            sql: stryMutAct_9fa48("1568") ? sql : (stryCov_9fa48("1568"), sql.substring(0, 100))
          }));
          throw error;
        }
      }
    }
  }
  async queryWithParams(sql: string, params: QueryParameter[]): Promise<any> {
    if (stryMutAct_9fa48("1569")) {
      {}
    } else {
      stryCov_9fa48("1569");
      if (stryMutAct_9fa48("1572") ? false : stryMutAct_9fa48("1571") ? true : stryMutAct_9fa48("1570") ? this.connection : (stryCov_9fa48("1570", "1571", "1572"), !this.connection)) {
        if (stryMutAct_9fa48("1573")) {
          {}
        } else {
          stryCov_9fa48("1573");
          throw new Error(stryMutAct_9fa48("1574") ? `` : (stryCov_9fa48("1574"), `${this.name}: Conexão não inicializada`));
        }
      }
      try {
        if (stryMutAct_9fa48("1575")) {
          {}
        } else {
          stryCov_9fa48("1575");
          // ODBC usa '?' como placeholder
          const values = params.map(stryMutAct_9fa48("1576") ? () => undefined : (stryCov_9fa48("1576"), p => p.value));
          const result = await this.connection.query(sql, values);
          return result;
        }
      } catch (error) {
        if (stryMutAct_9fa48("1577")) {
          {}
        } else {
          stryCov_9fa48("1577");
          log.error(stryMutAct_9fa48("1578") ? `` : (stryCov_9fa48("1578"), `${this.name}: Erro na query parametrizada`), stryMutAct_9fa48("1579") ? {} : (stryCov_9fa48("1579"), {
            error: error instanceof Error ? error.message : stryMutAct_9fa48("1580") ? "" : (stryCov_9fa48("1580"), 'Erro desconhecido'),
            params: params.map(stryMutAct_9fa48("1581") ? () => undefined : (stryCov_9fa48("1581"), p => stryMutAct_9fa48("1582") ? {} : (stryCov_9fa48("1582"), {
              name: p.name,
              type: p.type
            })))
          }));
          throw error;
        }
      }
    }
  }
  async close(): Promise<void> {
    if (stryMutAct_9fa48("1583")) {
      {}
    } else {
      stryCov_9fa48("1583");
      if (stryMutAct_9fa48("1585") ? false : stryMutAct_9fa48("1584") ? true : (stryCov_9fa48("1584", "1585"), this.connection)) {
        if (stryMutAct_9fa48("1586")) {
          {}
        } else {
          stryCov_9fa48("1586");
          await this.connection.close();
          this.connection = null;
          log.info(stryMutAct_9fa48("1587") ? `` : (stryCov_9fa48("1587"), `${this.name} desconectado`));
        }
      }
    }
  }
  isConnected(): boolean {
    if (stryMutAct_9fa48("1588")) {
      {}
    } else {
      stryCov_9fa48("1588");
      return stryMutAct_9fa48("1591") ? this.connection === null : stryMutAct_9fa48("1590") ? false : stryMutAct_9fa48("1589") ? true : (stryCov_9fa48("1589", "1590", "1591"), this.connection !== null);
    }
  }
  async healthCheck(): Promise<{
    connected: boolean;
    responseTime: number;
  }> {
    if (stryMutAct_9fa48("1592")) {
      {}
    } else {
      stryCov_9fa48("1592");
      const startTime = Date.now();
      try {
        if (stryMutAct_9fa48("1593")) {
          {}
        } else {
          stryCov_9fa48("1593");
          if (stryMutAct_9fa48("1596") ? false : stryMutAct_9fa48("1595") ? true : stryMutAct_9fa48("1594") ? this.connection : (stryCov_9fa48("1594", "1595", "1596"), !this.connection)) {
            if (stryMutAct_9fa48("1597")) {
              {}
            } else {
              stryCov_9fa48("1597");
              return stryMutAct_9fa48("1598") ? {} : (stryCov_9fa48("1598"), {
                connected: stryMutAct_9fa48("1599") ? true : (stryCov_9fa48("1599"), false),
                responseTime: 0
              });
            }
          }
          await this.connection.query(stryMutAct_9fa48("1600") ? "" : (stryCov_9fa48("1600"), 'SELECT 1 AS health'));
          const responseTime = stryMutAct_9fa48("1601") ? Date.now() + startTime : (stryCov_9fa48("1601"), Date.now() - startTime);
          return stryMutAct_9fa48("1602") ? {} : (stryCov_9fa48("1602"), {
            connected: stryMutAct_9fa48("1603") ? false : (stryCov_9fa48("1603"), true),
            responseTime
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1604")) {
          {}
        } else {
          stryCov_9fa48("1604");
          log.error(stryMutAct_9fa48("1605") ? `` : (stryCov_9fa48("1605"), `${this.name}: Health check falhou`), stryMutAct_9fa48("1606") ? {} : (stryCov_9fa48("1606"), {
            error: error instanceof Error ? error.message : stryMutAct_9fa48("1607") ? "" : (stryCov_9fa48("1607"), 'Erro desconhecido')
          }));
          return stryMutAct_9fa48("1608") ? {} : (stryCov_9fa48("1608"), {
            connected: stryMutAct_9fa48("1609") ? true : (stryCov_9fa48("1609"), false),
            responseTime: stryMutAct_9fa48("1610") ? Date.now() + startTime : (stryCov_9fa48("1610"), Date.now() - startTime)
          });
        }
      }
    }
  }
}