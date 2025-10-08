// @ts-nocheck
// src/infrastructure/database/connections/SqlServerConnection.ts
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
import sql from 'mssql';
import { IConnection, DatabaseConfig, QueryParameter } from '../types';
import { log } from '@shared/utils/logger';
import { retryWithBackoff, isRetryableError } from '@shared/utils/retry';
import { config } from '@config/env.config';
export class SqlServerConnection implements IConnection {
  private pool: sql.ConnectionPool | null = null;
  private config: DatabaseConfig;
  private name: string;
  constructor(config: DatabaseConfig, name: string = stryMutAct_9fa48("1611") ? "" : (stryCov_9fa48("1611"), 'SQL Server')) {
    if (stryMutAct_9fa48("1612")) {
      {}
    } else {
      stryCov_9fa48("1612");
      this.config = config;
      this.name = name;
    }
  }
  async connect(): Promise<void> {
    if (stryMutAct_9fa48("1613")) {
      {}
    } else {
      stryCov_9fa48("1613");
      const context = stryMutAct_9fa48("1614") ? `` : (stryCov_9fa48("1614"), `${this.name} (SQL Server)`);
      log.info(stryMutAct_9fa48("1615") ? `` : (stryCov_9fa48("1615"), `Conectando ${context}...`));
      log.debug(stryMutAct_9fa48("1616") ? "" : (stryCov_9fa48("1616"), '🔍 DEBUG - Config recebida:'), stryMutAct_9fa48("1617") ? {} : (stryCov_9fa48("1617"), {
        server: this.config.server,
        user: this.config.user,
        password: stryMutAct_9fa48("1618") ? "" : (stryCov_9fa48("1618"), '*********'),
        database: this.config.database,
        port: this.config.port
      }));
      const sqlConfig: sql.config = stryMutAct_9fa48("1619") ? {} : (stryCov_9fa48("1619"), {
        server: stryMutAct_9fa48("1622") ? this.config.server && '' : stryMutAct_9fa48("1621") ? false : stryMutAct_9fa48("1620") ? true : (stryCov_9fa48("1620", "1621", "1622"), this.config.server || (stryMutAct_9fa48("1623") ? "Stryker was here!" : (stryCov_9fa48("1623"), ''))),
        port: stryMutAct_9fa48("1626") ? this.config.port && 1433 : stryMutAct_9fa48("1625") ? false : stryMutAct_9fa48("1624") ? true : (stryCov_9fa48("1624", "1625", "1626"), this.config.port || 1433),
        user: stryMutAct_9fa48("1629") ? this.config.user && '' : stryMutAct_9fa48("1628") ? false : stryMutAct_9fa48("1627") ? true : (stryCov_9fa48("1627", "1628", "1629"), this.config.user || (stryMutAct_9fa48("1630") ? "Stryker was here!" : (stryCov_9fa48("1630"), ''))),
        password: stryMutAct_9fa48("1633") ? this.config.password && '' : stryMutAct_9fa48("1632") ? false : stryMutAct_9fa48("1631") ? true : (stryCov_9fa48("1631", "1632", "1633"), this.config.password || (stryMutAct_9fa48("1634") ? "Stryker was here!" : (stryCov_9fa48("1634"), ''))),
        database: stryMutAct_9fa48("1637") ? this.config.database && '' : stryMutAct_9fa48("1636") ? false : stryMutAct_9fa48("1635") ? true : (stryCov_9fa48("1635", "1636", "1637"), this.config.database || (stryMutAct_9fa48("1638") ? "Stryker was here!" : (stryCov_9fa48("1638"), ''))),
        connectionTimeout: stryMutAct_9fa48("1641") ? this.config.connectionTimeout && 15000 : stryMutAct_9fa48("1640") ? false : stryMutAct_9fa48("1639") ? true : (stryCov_9fa48("1639", "1640", "1641"), this.config.connectionTimeout || 15000),
        requestTimeout: stryMutAct_9fa48("1644") ? this.config.requestTimeout && 30000 : stryMutAct_9fa48("1643") ? false : stryMutAct_9fa48("1642") ? true : (stryCov_9fa48("1642", "1643", "1644"), this.config.requestTimeout || 30000),
        options: stryMutAct_9fa48("1645") ? {} : (stryCov_9fa48("1645"), {
          encrypt: stryMutAct_9fa48("1646") ? this.config.encrypt && false : (stryCov_9fa48("1646"), this.config.encrypt ?? (stryMutAct_9fa48("1647") ? true : (stryCov_9fa48("1647"), false))),
          trustServerCertificate: stryMutAct_9fa48("1648") ? this.config.trustServerCertificate && true : (stryCov_9fa48("1648"), this.config.trustServerCertificate ?? (stryMutAct_9fa48("1649") ? false : (stryCov_9fa48("1649"), true))),
          enableArithAbort: stryMutAct_9fa48("1650") ? false : (stryCov_9fa48("1650"), true)
        }),
        pool: stryMutAct_9fa48("1651") ? {} : (stryCov_9fa48("1651"), {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        })
      });

      // ✅ NOVO: Retry com backoff exponencial
      const retryOptions = stryMutAct_9fa48("1652") ? {} : (stryCov_9fa48("1652"), {
        maxAttempts: config.database.retry.maxAttempts,
        initialDelay: config.database.retry.initialDelay,
        maxDelay: config.database.retry.maxDelay,
        backoffFactor: config.database.retry.backoffFactor,
        jitter: stryMutAct_9fa48("1653") ? false : (stryCov_9fa48("1653"), true),
        onRetry: (error: Error, attempt: number, delay: number) => {
          if (stryMutAct_9fa48("1654")) {
            {}
          } else {
            stryCov_9fa48("1654");
            // Só retry em erros de conexão
            if (stryMutAct_9fa48("1657") ? false : stryMutAct_9fa48("1656") ? true : stryMutAct_9fa48("1655") ? isRetryableError(error) : (stryCov_9fa48("1655", "1656", "1657"), !isRetryableError(error))) {
              if (stryMutAct_9fa48("1658")) {
                {}
              } else {
                stryCov_9fa48("1658");
                log.error(stryMutAct_9fa48("1659") ? `` : (stryCov_9fa48("1659"), `${context}: Erro não-retryable, abortando`), stryMutAct_9fa48("1660") ? {} : (stryCov_9fa48("1660"), {
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
        if (stryMutAct_9fa48("1661")) {
          {}
        } else {
          stryCov_9fa48("1661");
          this.pool = await retryWithBackoff(async () => {
            if (stryMutAct_9fa48("1662")) {
              {}
            } else {
              stryCov_9fa48("1662");
              const pool = new sql.ConnectionPool(sqlConfig);

              // ✅ CRITICAL: Timeout manual para forçar erro se travar
              const connectPromise = pool.connect();
              const timeoutPromise = new Promise<never>((_, reject) => {
                if (stryMutAct_9fa48("1663")) {
                  {}
                } else {
                  stryCov_9fa48("1663");
                  setTimeout(() => {
                    if (stryMutAct_9fa48("1664")) {
                      {}
                    } else {
                      stryCov_9fa48("1664");
                      reject(new Error(stryMutAct_9fa48("1665") ? `` : (stryCov_9fa48("1665"), `Connection timeout after ${sqlConfig.connectionTimeout}ms`)));
                    }
                  }, sqlConfig.connectionTimeout);
                }
              });

              // Race: o que resolver/rejeitar primeiro ganha
              await Promise.race(stryMutAct_9fa48("1666") ? [] : (stryCov_9fa48("1666"), [connectPromise, timeoutPromise]));
              return pool;
            }
          }, retryOptions, context);
          log.info(stryMutAct_9fa48("1667") ? `` : (stryCov_9fa48("1667"), `${context} conectado`));
        }
      } catch (error) {
        if (stryMutAct_9fa48("1668")) {
          {}
        } else {
          stryCov_9fa48("1668");
          log.error(stryMutAct_9fa48("1669") ? `` : (stryCov_9fa48("1669"), `${context}: Falha após todas as tentativas de retry`), stryMutAct_9fa48("1670") ? {} : (stryCov_9fa48("1670"), {
            error: error instanceof Error ? error.message : stryMutAct_9fa48("1671") ? "" : (stryCov_9fa48("1671"), 'Erro desconhecido'),
            maxAttempts: retryOptions.maxAttempts
          }));
          throw error;
        }
      }
    }
  }
  async query(sql: string): Promise<any> {
    if (stryMutAct_9fa48("1672")) {
      {}
    } else {
      stryCov_9fa48("1672");
      if (stryMutAct_9fa48("1675") ? false : stryMutAct_9fa48("1674") ? true : stryMutAct_9fa48("1673") ? this.pool : (stryCov_9fa48("1673", "1674", "1675"), !this.pool)) {
        if (stryMutAct_9fa48("1676")) {
          {}
        } else {
          stryCov_9fa48("1676");
          throw new Error(stryMutAct_9fa48("1677") ? `` : (stryCov_9fa48("1677"), `${this.name}: Pool não inicializado`));
        }
      }
      try {
        if (stryMutAct_9fa48("1678")) {
          {}
        } else {
          stryCov_9fa48("1678");
          const result = await this.pool.request().query(sql);
          return result.recordset;
        }
      } catch (error) {
        if (stryMutAct_9fa48("1679")) {
          {}
        } else {
          stryCov_9fa48("1679");
          log.error(stryMutAct_9fa48("1680") ? `` : (stryCov_9fa48("1680"), `${this.name}: Erro na query`), stryMutAct_9fa48("1681") ? {} : (stryCov_9fa48("1681"), {
            error: error instanceof Error ? error.message : stryMutAct_9fa48("1682") ? "" : (stryCov_9fa48("1682"), 'Erro desconhecido'),
            sql: stryMutAct_9fa48("1683") ? sql : (stryCov_9fa48("1683"), sql.substring(0, 100)) // Log apenas início da query
          }));
          throw error;
        }
      }
    }
  }
  async queryWithParams(sql: string, params: QueryParameter[]): Promise<any> {
    if (stryMutAct_9fa48("1684")) {
      {}
    } else {
      stryCov_9fa48("1684");
      if (stryMutAct_9fa48("1687") ? false : stryMutAct_9fa48("1686") ? true : stryMutAct_9fa48("1685") ? this.pool : (stryCov_9fa48("1685", "1686", "1687"), !this.pool)) {
        if (stryMutAct_9fa48("1688")) {
          {}
        } else {
          stryCov_9fa48("1688");
          throw new Error(stryMutAct_9fa48("1689") ? `` : (stryCov_9fa48("1689"), `${this.name}: Pool não inicializado`));
        }
      }
      try {
        if (stryMutAct_9fa48("1690")) {
          {}
        } else {
          stryCov_9fa48("1690");
          const request = this.pool.request();

          // Adicionar parâmetros
          params.forEach(param => {
            if (stryMutAct_9fa48("1691")) {
              {}
            } else {
              stryCov_9fa48("1691");
              const sqlType = this.getSqlType(param.type);
              request.input(param.name, sqlType, param.value);
            }
          });
          const result = await request.query(sql);
          return result.recordset;
        }
      } catch (error) {
        if (stryMutAct_9fa48("1692")) {
          {}
        } else {
          stryCov_9fa48("1692");
          log.error(stryMutAct_9fa48("1693") ? `` : (stryCov_9fa48("1693"), `${this.name}: Erro na query parametrizada`), stryMutAct_9fa48("1694") ? {} : (stryCov_9fa48("1694"), {
            error: error instanceof Error ? error.message : stryMutAct_9fa48("1695") ? "" : (stryCov_9fa48("1695"), 'Erro desconhecido'),
            params: params.map(stryMutAct_9fa48("1696") ? () => undefined : (stryCov_9fa48("1696"), p => stryMutAct_9fa48("1697") ? {} : (stryCov_9fa48("1697"), {
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
    if (stryMutAct_9fa48("1698")) {
      {}
    } else {
      stryCov_9fa48("1698");
      if (stryMutAct_9fa48("1700") ? false : stryMutAct_9fa48("1699") ? true : (stryCov_9fa48("1699", "1700"), this.pool)) {
        if (stryMutAct_9fa48("1701")) {
          {}
        } else {
          stryCov_9fa48("1701");
          await this.pool.close();
          this.pool = null;
          log.info(stryMutAct_9fa48("1702") ? `` : (stryCov_9fa48("1702"), `${this.name} desconectado`));
        }
      }
    }
  }
  isConnected(): boolean {
    if (stryMutAct_9fa48("1703")) {
      {}
    } else {
      stryCov_9fa48("1703");
      return stryMutAct_9fa48("1706") ? this.pool === null : stryMutAct_9fa48("1705") ? false : stryMutAct_9fa48("1704") ? true : (stryCov_9fa48("1704", "1705", "1706"), this.pool !== null);
    }
  }
  async healthCheck(): Promise<{
    connected: boolean;
    responseTime: number;
  }> {
    if (stryMutAct_9fa48("1707")) {
      {}
    } else {
      stryCov_9fa48("1707");
      const startTime = Date.now();
      try {
        if (stryMutAct_9fa48("1708")) {
          {}
        } else {
          stryCov_9fa48("1708");
          if (stryMutAct_9fa48("1711") ? false : stryMutAct_9fa48("1710") ? true : stryMutAct_9fa48("1709") ? this.pool : (stryCov_9fa48("1709", "1710", "1711"), !this.pool)) {
            if (stryMutAct_9fa48("1712")) {
              {}
            } else {
              stryCov_9fa48("1712");
              return stryMutAct_9fa48("1713") ? {} : (stryCov_9fa48("1713"), {
                connected: stryMutAct_9fa48("1714") ? true : (stryCov_9fa48("1714"), false),
                responseTime: 0
              });
            }
          }
          await this.pool.request().query(stryMutAct_9fa48("1715") ? "" : (stryCov_9fa48("1715"), 'SELECT 1 AS health'));
          const responseTime = stryMutAct_9fa48("1716") ? Date.now() + startTime : (stryCov_9fa48("1716"), Date.now() - startTime);
          return stryMutAct_9fa48("1717") ? {} : (stryCov_9fa48("1717"), {
            connected: stryMutAct_9fa48("1718") ? false : (stryCov_9fa48("1718"), true),
            responseTime
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1719")) {
          {}
        } else {
          stryCov_9fa48("1719");
          log.error(stryMutAct_9fa48("1720") ? `` : (stryCov_9fa48("1720"), `${this.name}: Health check falhou`), stryMutAct_9fa48("1721") ? {} : (stryCov_9fa48("1721"), {
            error: error instanceof Error ? error.message : stryMutAct_9fa48("1722") ? "" : (stryCov_9fa48("1722"), 'Erro desconhecido')
          }));
          return stryMutAct_9fa48("1723") ? {} : (stryCov_9fa48("1723"), {
            connected: stryMutAct_9fa48("1724") ? true : (stryCov_9fa48("1724"), false),
            responseTime: stryMutAct_9fa48("1725") ? Date.now() + startTime : (stryCov_9fa48("1725"), Date.now() - startTime)
          });
        }
      }
    }
  }
  private getSqlType(type: string): any {
    if (stryMutAct_9fa48("1726")) {
      {}
    } else {
      stryCov_9fa48("1726");
      const typeMap: Record<string, any> = stryMutAct_9fa48("1727") ? {} : (stryCov_9fa48("1727"), {
        varchar: sql.VarChar,
        int: sql.Int,
        bigint: sql.BigInt,
        float: sql.Float,
        decimal: sql.Decimal,
        datetime: sql.DateTime,
        bit: sql.Bit
      });
      return stryMutAct_9fa48("1730") ? typeMap[type.toLowerCase()] && sql.VarChar : stryMutAct_9fa48("1729") ? false : stryMutAct_9fa48("1728") ? true : (stryCov_9fa48("1728", "1729", "1730"), typeMap[stryMutAct_9fa48("1731") ? type.toUpperCase() : (stryCov_9fa48("1731"), type.toLowerCase())] || sql.VarChar);
    }
  }
}