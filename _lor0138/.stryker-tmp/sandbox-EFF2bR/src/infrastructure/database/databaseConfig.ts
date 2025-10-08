// @ts-nocheck
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
import odbc from 'odbc';
type ConnectionType = 'sqlserver' | 'odbc';
export class DatabaseManager {
  // SQL Server pools
  private static poolEmp: sql.ConnectionPool | null = null;
  private static poolMult: sql.ConnectionPool | null = null;

  // ODBC connections
  private static odbcPoolEmp: odbc.Pool | null = null;
  private static odbcPoolMult: odbc.Pool | null = null;
  private static connectionType: ConnectionType = stryMutAct_9fa48("1732") ? "" : (stryCov_9fa48("1732"), 'odbc');
  private static useMockData: boolean = stryMutAct_9fa48("1733") ? true : (stryCov_9fa48("1733"), false);
  private static connectionError: string | null = null;
  private static isInitialized: boolean = stryMutAct_9fa48("1734") ? true : (stryCov_9fa48("1734"), false);
  private static initializationPromise: Promise<void> | null = null;

  // Mock data para fallback
  private static mockData = stryMutAct_9fa48("1735") ? {} : (stryCov_9fa48("1735"), {
    itens: stryMutAct_9fa48("1736") ? [] : (stryCov_9fa48("1736"), [stryMutAct_9fa48("1737") ? {} : (stryCov_9fa48("1737"), {
      itemCodigo: stryMutAct_9fa48("1738") ? "" : (stryCov_9fa48("1738"), 'ITEM001'),
      itemDescricao: stryMutAct_9fa48("1739") ? "" : (stryCov_9fa48("1739"), 'Item Teste 1'),
      unidadeMedidaCodigo: stryMutAct_9fa48("1740") ? "" : (stryCov_9fa48("1740"), 'UN'),
      grupoEstoqueCodigo: 1,
      familiaCodigo: stryMutAct_9fa48("1741") ? "" : (stryCov_9fa48("1741"), 'FAM01')
    })])
  });

  // Configuração SQL Server EMP
  private static getSqlServerConfigEmp(): sql.config {
    if (stryMutAct_9fa48("1742")) {
      {}
    } else {
      stryCov_9fa48("1742");
      return stryMutAct_9fa48("1743") ? {} : (stryCov_9fa48("1743"), {
        server: stryMutAct_9fa48("1746") ? process.env.DB_SERVER && '' : stryMutAct_9fa48("1745") ? false : stryMutAct_9fa48("1744") ? true : (stryCov_9fa48("1744", "1745", "1746"), process.env.DB_SERVER || (stryMutAct_9fa48("1747") ? "Stryker was here!" : (stryCov_9fa48("1747"), ''))),
        database: stryMutAct_9fa48("1750") ? process.env.DB_DATABASE_EMP && 'PRD_EMS2EMP' : stryMutAct_9fa48("1749") ? false : stryMutAct_9fa48("1748") ? true : (stryCov_9fa48("1748", "1749", "1750"), process.env.DB_DATABASE_EMP || (stryMutAct_9fa48("1751") ? "" : (stryCov_9fa48("1751"), 'PRD_EMS2EMP'))),
        user: stryMutAct_9fa48("1754") ? process.env.DB_USER && '' : stryMutAct_9fa48("1753") ? false : stryMutAct_9fa48("1752") ? true : (stryCov_9fa48("1752", "1753", "1754"), process.env.DB_USER || (stryMutAct_9fa48("1755") ? "Stryker was here!" : (stryCov_9fa48("1755"), ''))),
        password: stryMutAct_9fa48("1758") ? process.env.DB_PASSWORD && '' : stryMutAct_9fa48("1757") ? false : stryMutAct_9fa48("1756") ? true : (stryCov_9fa48("1756", "1757", "1758"), process.env.DB_PASSWORD || (stryMutAct_9fa48("1759") ? "Stryker was here!" : (stryCov_9fa48("1759"), ''))),
        port: parseInt(stryMutAct_9fa48("1762") ? process.env.DB_PORT && '1433' : stryMutAct_9fa48("1761") ? false : stryMutAct_9fa48("1760") ? true : (stryCov_9fa48("1760", "1761", "1762"), process.env.DB_PORT || (stryMutAct_9fa48("1763") ? "" : (stryCov_9fa48("1763"), '1433')))),
        options: stryMutAct_9fa48("1764") ? {} : (stryCov_9fa48("1764"), {
          encrypt: stryMutAct_9fa48("1767") ? process.env.DB_ENCRYPT !== 'true' : stryMutAct_9fa48("1766") ? false : stryMutAct_9fa48("1765") ? true : (stryCov_9fa48("1765", "1766", "1767"), process.env.DB_ENCRYPT === (stryMutAct_9fa48("1768") ? "" : (stryCov_9fa48("1768"), 'true'))),
          trustServerCertificate: stryMutAct_9fa48("1771") ? process.env.DB_TRUST_SERVER_CERTIFICATE !== 'true' : stryMutAct_9fa48("1770") ? false : stryMutAct_9fa48("1769") ? true : (stryCov_9fa48("1769", "1770", "1771"), process.env.DB_TRUST_SERVER_CERTIFICATE === (stryMutAct_9fa48("1772") ? "" : (stryCov_9fa48("1772"), 'true'))),
          connectTimeout: parseInt(stryMutAct_9fa48("1775") ? process.env.DB_CONNECTION_TIMEOUT && '30000' : stryMutAct_9fa48("1774") ? false : stryMutAct_9fa48("1773") ? true : (stryCov_9fa48("1773", "1774", "1775"), process.env.DB_CONNECTION_TIMEOUT || (stryMutAct_9fa48("1776") ? "" : (stryCov_9fa48("1776"), '30000')))),
          requestTimeout: parseInt(stryMutAct_9fa48("1779") ? process.env.DB_REQUEST_TIMEOUT && '30000' : stryMutAct_9fa48("1778") ? false : stryMutAct_9fa48("1777") ? true : (stryCov_9fa48("1777", "1778", "1779"), process.env.DB_REQUEST_TIMEOUT || (stryMutAct_9fa48("1780") ? "" : (stryCov_9fa48("1780"), '30000'))))
        }),
        pool: stryMutAct_9fa48("1781") ? {} : (stryCov_9fa48("1781"), {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        })
      });
    }
  }

  // Configuração SQL Server MULT
  private static getSqlServerConfigMult(): sql.config {
    if (stryMutAct_9fa48("1782")) {
      {}
    } else {
      stryCov_9fa48("1782");
      return stryMutAct_9fa48("1783") ? {} : (stryCov_9fa48("1783"), {
        ...this.getSqlServerConfigEmp(),
        database: stryMutAct_9fa48("1786") ? process.env.DB_DATABASE_MULT && 'PRD_EMS2MULT' : stryMutAct_9fa48("1785") ? false : stryMutAct_9fa48("1784") ? true : (stryCov_9fa48("1784", "1785", "1786"), process.env.DB_DATABASE_MULT || (stryMutAct_9fa48("1787") ? "" : (stryCov_9fa48("1787"), 'PRD_EMS2MULT')))
      });
    }
  }

  // Connection string ODBC
  private static getOdbcConnectionString(database: 'EMP' | 'MULT'): string {
    if (stryMutAct_9fa48("1788")) {
      {}
    } else {
      stryCov_9fa48("1788");
      const dsnName = (stryMutAct_9fa48("1791") ? database !== 'EMP' : stryMutAct_9fa48("1790") ? false : stryMutAct_9fa48("1789") ? true : (stryCov_9fa48("1789", "1790", "1791"), database === (stryMutAct_9fa48("1792") ? "" : (stryCov_9fa48("1792"), 'EMP')))) ? stryMutAct_9fa48("1795") ? process.env.ODBC_DSN_EMP && 'PRD_EMS2EMP' : stryMutAct_9fa48("1794") ? false : stryMutAct_9fa48("1793") ? true : (stryCov_9fa48("1793", "1794", "1795"), process.env.ODBC_DSN_EMP || (stryMutAct_9fa48("1796") ? "" : (stryCov_9fa48("1796"), 'PRD_EMS2EMP'))) : stryMutAct_9fa48("1799") ? process.env.ODBC_DSN_MULT && 'PRD_EMS2MULT' : stryMutAct_9fa48("1798") ? false : stryMutAct_9fa48("1797") ? true : (stryCov_9fa48("1797", "1798", "1799"), process.env.ODBC_DSN_MULT || (stryMutAct_9fa48("1800") ? "" : (stryCov_9fa48("1800"), 'PRD_EMS2MULT')));
      const user = stryMutAct_9fa48("1803") ? (process.env.ODBC_USER || process.env.DB_USER) && '' : stryMutAct_9fa48("1802") ? false : stryMutAct_9fa48("1801") ? true : (stryCov_9fa48("1801", "1802", "1803"), (stryMutAct_9fa48("1805") ? process.env.ODBC_USER && process.env.DB_USER : stryMutAct_9fa48("1804") ? false : (stryCov_9fa48("1804", "1805"), process.env.ODBC_USER || process.env.DB_USER)) || (stryMutAct_9fa48("1806") ? "Stryker was here!" : (stryCov_9fa48("1806"), '')));
      const password = stryMutAct_9fa48("1809") ? (process.env.ODBC_PASSWORD || process.env.DB_PASSWORD) && '' : stryMutAct_9fa48("1808") ? false : stryMutAct_9fa48("1807") ? true : (stryCov_9fa48("1807", "1808", "1809"), (stryMutAct_9fa48("1811") ? process.env.ODBC_PASSWORD && process.env.DB_PASSWORD : stryMutAct_9fa48("1810") ? false : (stryCov_9fa48("1810", "1811"), process.env.ODBC_PASSWORD || process.env.DB_PASSWORD)) || (stryMutAct_9fa48("1812") ? "Stryker was here!" : (stryCov_9fa48("1812"), '')));
      return stryMutAct_9fa48("1813") ? `` : (stryCov_9fa48("1813"), `DSN=${dsnName};UID=${user};PWD=${password}`);
    }
  }

  // Inicialização principal
  static async initialize(): Promise<void> {
    if (stryMutAct_9fa48("1814")) {
      {}
    } else {
      stryCov_9fa48("1814");
      if (stryMutAct_9fa48("1816") ? false : stryMutAct_9fa48("1815") ? true : (stryCov_9fa48("1815", "1816"), this.initializationPromise)) {
        if (stryMutAct_9fa48("1817")) {
          {}
        } else {
          stryCov_9fa48("1817");
          return this.initializationPromise;
        }
      }
      if (stryMutAct_9fa48("1819") ? false : stryMutAct_9fa48("1818") ? true : (stryCov_9fa48("1818", "1819"), this.isInitialized)) {
        if (stryMutAct_9fa48("1820")) {
          {}
        } else {
          stryCov_9fa48("1820");
          return Promise.resolve();
        }
      }
      this.initializationPromise = this.doInitialize();
      try {
        if (stryMutAct_9fa48("1821")) {
          {}
        } else {
          stryCov_9fa48("1821");
          await this.initializationPromise;
        }
      } finally {
        if (stryMutAct_9fa48("1822")) {
          {}
        } else {
          stryCov_9fa48("1822");
          this.initializationPromise = null;
        }
      }
    }
  }

  // Executa inicialização
  private static async doInitialize(): Promise<void> {
    if (stryMutAct_9fa48("1823")) {
      {}
    } else {
      stryCov_9fa48("1823");
      console.log(stryMutAct_9fa48("1824") ? "" : (stryCov_9fa48("1824"), 'Inicializando conexoes Datasul...'));
      this.connectionType = stryMutAct_9fa48("1827") ? process.env.DB_CONNECTION_TYPE as ConnectionType && 'odbc' : stryMutAct_9fa48("1826") ? false : stryMutAct_9fa48("1825") ? true : (stryCov_9fa48("1825", "1826", "1827"), process.env.DB_CONNECTION_TYPE as ConnectionType || (stryMutAct_9fa48("1828") ? "" : (stryCov_9fa48("1828"), 'odbc')));
      console.log(stryMutAct_9fa48("1829") ? `` : (stryCov_9fa48("1829"), `Modo: ${stryMutAct_9fa48("1830") ? this.connectionType.toLowerCase() : (stryCov_9fa48("1830"), this.connectionType.toUpperCase())}`));
      try {
        if (stryMutAct_9fa48("1831")) {
          {}
        } else {
          stryCov_9fa48("1831");
          if (stryMutAct_9fa48("1834") ? this.connectionType !== 'odbc' : stryMutAct_9fa48("1833") ? false : stryMutAct_9fa48("1832") ? true : (stryCov_9fa48("1832", "1833", "1834"), this.connectionType === (stryMutAct_9fa48("1835") ? "" : (stryCov_9fa48("1835"), 'odbc')))) {
            if (stryMutAct_9fa48("1836")) {
              {}
            } else {
              stryCov_9fa48("1836");
              await this.initializeOdbc();
            }
          } else {
            if (stryMutAct_9fa48("1837")) {
              {}
            } else {
              stryCov_9fa48("1837");
              await this.initializeSqlServer();
            }
          }
          this.useMockData = stryMutAct_9fa48("1838") ? true : (stryCov_9fa48("1838"), false);
          this.isInitialized = stryMutAct_9fa48("1839") ? false : (stryCov_9fa48("1839"), true);
          console.log(stryMutAct_9fa48("1840") ? "" : (stryCov_9fa48("1840"), 'CONECTADO AO DATASUL'));
        }
      } catch (error) {
        if (stryMutAct_9fa48("1841")) {
          {}
        } else {
          stryCov_9fa48("1841");
          this.connectionError = (error as Error).message;
          this.useMockData = stryMutAct_9fa48("1842") ? false : (stryCov_9fa48("1842"), true);
          this.isInitialized = stryMutAct_9fa48("1843") ? false : (stryCov_9fa48("1843"), true);
          console.log(stryMutAct_9fa48("1844") ? "" : (stryCov_9fa48("1844"), 'Usando modo mock'));
          console.log(stryMutAct_9fa48("1845") ? "" : (stryCov_9fa48("1845"), 'Erro:'), this.connectionError);
        }
      }
    }
  }

  // Inicializa ODBC
  private static async initializeOdbc(): Promise<void> {
    if (stryMutAct_9fa48("1846")) {
      {}
    } else {
      stryCov_9fa48("1846");
      console.log(stryMutAct_9fa48("1847") ? "" : (stryCov_9fa48("1847"), 'Conectando via ODBC ao Progress...'));
      try {
        if (stryMutAct_9fa48("1848")) {
          {}
        } else {
          stryCov_9fa48("1848");
          const connStrEmp = this.getOdbcConnectionString(stryMutAct_9fa48("1849") ? "" : (stryCov_9fa48("1849"), 'EMP'));
          this.odbcPoolEmp = await odbc.pool(connStrEmp);
          console.log(stryMutAct_9fa48("1850") ? "" : (stryCov_9fa48("1850"), 'EMP (ODBC Progress) conectado'));
          const connStrMult = this.getOdbcConnectionString(stryMutAct_9fa48("1851") ? "" : (stryCov_9fa48("1851"), 'MULT'));
          this.odbcPoolMult = await odbc.pool(connStrMult);
          console.log(stryMutAct_9fa48("1852") ? "" : (stryCov_9fa48("1852"), 'MULT (ODBC Progress) conectado'));

          // Testa conexão
          const result = await this.odbcPoolEmp.query(stryMutAct_9fa48("1853") ? "" : (stryCov_9fa48("1853"), 'SELECT CURRENT_TIMESTAMP as data FROM pub.sysprogress WHERE rownum = 1'));
          console.log(stryMutAct_9fa48("1854") ? "" : (stryCov_9fa48("1854"), 'Teste conexao OK:'), stryMutAct_9fa48("1855") ? result[0] : (stryCov_9fa48("1855"), result?.[0]));
        }
      } catch (error) {
        if (stryMutAct_9fa48("1856")) {
          {}
        } else {
          stryCov_9fa48("1856");
          console.error(stryMutAct_9fa48("1857") ? "" : (stryCov_9fa48("1857"), 'Erro ao conectar ODBC:'), error);
          throw error;
        }
      }
    }
  }

  // Inicializa SQL Server
  private static async initializeSqlServer(): Promise<void> {
    if (stryMutAct_9fa48("1858")) {
      {}
    } else {
      stryCov_9fa48("1858");
      console.log(stryMutAct_9fa48("1859") ? "" : (stryCov_9fa48("1859"), 'Conectando via SQL Server...'));
      try {
        if (stryMutAct_9fa48("1860")) {
          {}
        } else {
          stryCov_9fa48("1860");
          this.poolEmp = new sql.ConnectionPool(this.getSqlServerConfigEmp());
          await this.poolEmp.connect();
          console.log(stryMutAct_9fa48("1861") ? "" : (stryCov_9fa48("1861"), 'EMP (SQL Server) conectado'));
          this.poolMult = new sql.ConnectionPool(this.getSqlServerConfigMult());
          await this.poolMult.connect();
          console.log(stryMutAct_9fa48("1862") ? "" : (stryCov_9fa48("1862"), 'MULT (SQL Server) conectado'));
          const result = await this.poolEmp.request().query(stryMutAct_9fa48("1863") ? "" : (stryCov_9fa48("1863"), 'SELECT GETDATE() as data'));
          console.log(stryMutAct_9fa48("1864") ? "" : (stryCov_9fa48("1864"), 'Teste conexao OK:'), stryMutAct_9fa48("1865") ? result.recordset[0].data : (stryCov_9fa48("1865"), result.recordset[0]?.data));
        }
      } catch (error) {
        if (stryMutAct_9fa48("1866")) {
          {}
        } else {
          stryCov_9fa48("1866");
          console.error(stryMutAct_9fa48("1867") ? "" : (stryCov_9fa48("1867"), 'Erro ao conectar SQL Server:'), error);
          throw error;
        }
      }
    }
  }

  // Executa query no banco EMP
  static async executeQueryEmp(query: string): Promise<any> {
    if (stryMutAct_9fa48("1868")) {
      {}
    } else {
      stryCov_9fa48("1868");
      if (stryMutAct_9fa48("1870") ? false : stryMutAct_9fa48("1869") ? true : (stryCov_9fa48("1869", "1870"), this.initializationPromise)) {
        if (stryMutAct_9fa48("1871")) {
          {}
        } else {
          stryCov_9fa48("1871");
          await this.initializationPromise;
        }
      }
      if (stryMutAct_9fa48("1873") ? false : stryMutAct_9fa48("1872") ? true : (stryCov_9fa48("1872", "1873"), this.useMockData)) {
        if (stryMutAct_9fa48("1874")) {
          {}
        } else {
          stryCov_9fa48("1874");
          return this.executeMockQuery(query);
        }
      }
      try {
        if (stryMutAct_9fa48("1875")) {
          {}
        } else {
          stryCov_9fa48("1875");
          if (stryMutAct_9fa48("1878") ? this.connectionType !== 'odbc' : stryMutAct_9fa48("1877") ? false : stryMutAct_9fa48("1876") ? true : (stryCov_9fa48("1876", "1877", "1878"), this.connectionType === (stryMutAct_9fa48("1879") ? "" : (stryCov_9fa48("1879"), 'odbc')))) {
            if (stryMutAct_9fa48("1880")) {
              {}
            } else {
              stryCov_9fa48("1880");
              if (stryMutAct_9fa48("1883") ? false : stryMutAct_9fa48("1882") ? true : stryMutAct_9fa48("1881") ? this.odbcPoolEmp : (stryCov_9fa48("1881", "1882", "1883"), !this.odbcPoolEmp)) {
                if (stryMutAct_9fa48("1884")) {
                  {}
                } else {
                  stryCov_9fa48("1884");
                  throw new Error(stryMutAct_9fa48("1885") ? "" : (stryCov_9fa48("1885"), 'Pool ODBC EMP indisponivel'));
                }
              }
              const result = await this.odbcPoolEmp.query(query);
              return result; // ODBC retorna array direto
            }
          } else {
            if (stryMutAct_9fa48("1886")) {
              {}
            } else {
              stryCov_9fa48("1886");
              if (stryMutAct_9fa48("1889") ? false : stryMutAct_9fa48("1888") ? true : stryMutAct_9fa48("1887") ? this.poolEmp?.connected : (stryCov_9fa48("1887", "1888", "1889"), !(stryMutAct_9fa48("1890") ? this.poolEmp.connected : (stryCov_9fa48("1890"), this.poolEmp?.connected)))) {
                if (stryMutAct_9fa48("1891")) {
                  {}
                } else {
                  stryCov_9fa48("1891");
                  throw new Error(stryMutAct_9fa48("1892") ? "" : (stryCov_9fa48("1892"), 'Pool SQL Server EMP indisponivel'));
                }
              }
              const result = await this.poolEmp.request().query(query);
              return result.recordset; // SQL Server tem .recordset
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("1893")) {
          {}
        } else {
          stryCov_9fa48("1893");
          console.error(stryMutAct_9fa48("1894") ? "" : (stryCov_9fa48("1894"), 'Erro query EMP:'), error);
          this.useMockData = stryMutAct_9fa48("1895") ? false : (stryCov_9fa48("1895"), true);
          return this.executeMockQuery(query);
        }
      }
    }
  }

  // Executa query no banco MULT
  static async executeQueryMult(query: string): Promise<any> {
    if (stryMutAct_9fa48("1896")) {
      {}
    } else {
      stryCov_9fa48("1896");
      if (stryMutAct_9fa48("1898") ? false : stryMutAct_9fa48("1897") ? true : (stryCov_9fa48("1897", "1898"), this.initializationPromise)) {
        if (stryMutAct_9fa48("1899")) {
          {}
        } else {
          stryCov_9fa48("1899");
          await this.initializationPromise;
        }
      }
      if (stryMutAct_9fa48("1901") ? false : stryMutAct_9fa48("1900") ? true : (stryCov_9fa48("1900", "1901"), this.useMockData)) {
        if (stryMutAct_9fa48("1902")) {
          {}
        } else {
          stryCov_9fa48("1902");
          return this.executeMockQuery(query);
        }
      }
      try {
        if (stryMutAct_9fa48("1903")) {
          {}
        } else {
          stryCov_9fa48("1903");
          if (stryMutAct_9fa48("1906") ? this.connectionType !== 'odbc' : stryMutAct_9fa48("1905") ? false : stryMutAct_9fa48("1904") ? true : (stryCov_9fa48("1904", "1905", "1906"), this.connectionType === (stryMutAct_9fa48("1907") ? "" : (stryCov_9fa48("1907"), 'odbc')))) {
            if (stryMutAct_9fa48("1908")) {
              {}
            } else {
              stryCov_9fa48("1908");
              if (stryMutAct_9fa48("1911") ? false : stryMutAct_9fa48("1910") ? true : stryMutAct_9fa48("1909") ? this.odbcPoolMult : (stryCov_9fa48("1909", "1910", "1911"), !this.odbcPoolMult)) {
                if (stryMutAct_9fa48("1912")) {
                  {}
                } else {
                  stryCov_9fa48("1912");
                  throw new Error(stryMutAct_9fa48("1913") ? "" : (stryCov_9fa48("1913"), 'Pool ODBC MULT indisponivel'));
                }
              }
              const result = await this.odbcPoolMult.query(query);
              return result;
            }
          } else {
            if (stryMutAct_9fa48("1914")) {
              {}
            } else {
              stryCov_9fa48("1914");
              if (stryMutAct_9fa48("1917") ? false : stryMutAct_9fa48("1916") ? true : stryMutAct_9fa48("1915") ? this.poolMult?.connected : (stryCov_9fa48("1915", "1916", "1917"), !(stryMutAct_9fa48("1918") ? this.poolMult.connected : (stryCov_9fa48("1918"), this.poolMult?.connected)))) {
                if (stryMutAct_9fa48("1919")) {
                  {}
                } else {
                  stryCov_9fa48("1919");
                  throw new Error(stryMutAct_9fa48("1920") ? "" : (stryCov_9fa48("1920"), 'Pool SQL Server MULT indisponivel'));
                }
              }
              const result = await this.poolMult.request().query(query);
              return result.recordset;
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("1921")) {
          {}
        } else {
          stryCov_9fa48("1921");
          console.error(stryMutAct_9fa48("1922") ? "" : (stryCov_9fa48("1922"), 'Erro query MULT:'), error);
          this.useMockData = stryMutAct_9fa48("1923") ? false : (stryCov_9fa48("1923"), true);
          return this.executeMockQuery(query);
        }
      }
    }
  }

  // Mock query
  private static async executeMockQuery(_query: string): Promise<any> {
    if (stryMutAct_9fa48("1924")) {
      {}
    } else {
      stryCov_9fa48("1924");
      console.log(stryMutAct_9fa48("1925") ? "" : (stryCov_9fa48("1925"), 'Executando query mock'));
      return this.mockData.itens;
    }
  }

  // Status da conexão
  static getConnectionStatus() {
    if (stryMutAct_9fa48("1926")) {
      {}
    } else {
      stryCov_9fa48("1926");
      return stryMutAct_9fa48("1927") ? {} : (stryCov_9fa48("1927"), {
        type: this.connectionType,
        mode: this.useMockData ? stryMutAct_9fa48("1928") ? "" : (stryCov_9fa48("1928"), 'MOCK_DATA') : stryMutAct_9fa48("1929") ? "" : (stryCov_9fa48("1929"), 'REAL_DATABASE'),
        error: stryMutAct_9fa48("1932") ? this.connectionError && undefined : stryMutAct_9fa48("1931") ? false : stryMutAct_9fa48("1930") ? true : (stryCov_9fa48("1930", "1931", "1932"), this.connectionError || undefined)
      });
    }
  }

  // Verifica se está pronto
  static isReady(): boolean {
    if (stryMutAct_9fa48("1933")) {
      {}
    } else {
      stryCov_9fa48("1933");
      return this.isInitialized;
    }
  }

  // Verifica se está usando mock
  static isUsingMockData(): boolean {
    if (stryMutAct_9fa48("1934")) {
      {}
    } else {
      stryCov_9fa48("1934");
      return this.useMockData;
    }
  }

  // Fecha todas as conexões
  static async close(): Promise<void> {
    if (stryMutAct_9fa48("1935")) {
      {}
    } else {
      stryCov_9fa48("1935");
      console.log(stryMutAct_9fa48("1936") ? "" : (stryCov_9fa48("1936"), 'Fechando conexoes...'));
      if (stryMutAct_9fa48("1938") ? false : stryMutAct_9fa48("1937") ? true : (stryCov_9fa48("1937", "1938"), this.poolEmp)) {
        if (stryMutAct_9fa48("1939")) {
          {}
        } else {
          stryCov_9fa48("1939");
          await this.poolEmp.close();
          this.poolEmp = null;
        }
      }
      if (stryMutAct_9fa48("1941") ? false : stryMutAct_9fa48("1940") ? true : (stryCov_9fa48("1940", "1941"), this.poolMult)) {
        if (stryMutAct_9fa48("1942")) {
          {}
        } else {
          stryCov_9fa48("1942");
          await this.poolMult.close();
          this.poolMult = null;
        }
      }
      if (stryMutAct_9fa48("1944") ? false : stryMutAct_9fa48("1943") ? true : (stryCov_9fa48("1943", "1944"), this.odbcPoolEmp)) {
        if (stryMutAct_9fa48("1945")) {
          {}
        } else {
          stryCov_9fa48("1945");
          await this.odbcPoolEmp.close();
          this.odbcPoolEmp = null;
        }
      }
      if (stryMutAct_9fa48("1947") ? false : stryMutAct_9fa48("1946") ? true : (stryCov_9fa48("1946", "1947"), this.odbcPoolMult)) {
        if (stryMutAct_9fa48("1948")) {
          {}
        } else {
          stryCov_9fa48("1948");
          await this.odbcPoolMult.close();
          this.odbcPoolMult = null;
        }
      }
      this.isInitialized = stryMutAct_9fa48("1949") ? true : (stryCov_9fa48("1949"), false);
      this.useMockData = stryMutAct_9fa48("1950") ? true : (stryCov_9fa48("1950"), false);
      console.log(stryMutAct_9fa48("1951") ? "" : (stryCov_9fa48("1951"), 'Conexoes fechadas'));
    }
  }

  // Testa conectividade
  static async testConnections(): Promise<{
    isConnected: boolean;
    type: ConnectionType;
    usingMock: boolean;
    error?: string;
  }> {
    if (stryMutAct_9fa48("1952")) {
      {}
    } else {
      stryCov_9fa48("1952");
      const status = this.getConnectionStatus();
      return stryMutAct_9fa48("1953") ? {} : (stryCov_9fa48("1953"), {
        isConnected: stryMutAct_9fa48("1954") ? this.useMockData : (stryCov_9fa48("1954"), !this.useMockData),
        type: this.connectionType,
        usingMock: this.useMockData,
        error: status.error
      });
    }
  }
}