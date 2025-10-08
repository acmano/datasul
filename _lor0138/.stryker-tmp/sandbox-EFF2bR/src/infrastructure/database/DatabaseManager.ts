// @ts-nocheck
// src/infrastructure/database/DatabaseManager.ts
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
import { ConnectionType, ConnectionStatus, IConnection, QueryParameter } from './types';
import { SqlServerConnection } from './connections/SqlServerConnection';
import { OdbcConnection } from './connections/OdbcConnection';
import { MockConnection } from './connections/MockConnection';
import { getSqlServerConfigEmp, getSqlServerConfigMult } from './config/sqlServerConfig';
import { getOdbcConnectionString } from './config/odbcConfig';
// ✅ NOVO: Import do helper de métricas
import { DatabaseMetricsHelper } from '@infrastructure/metrics/helpers/databaseMetrics';
export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private static connectionEmp: IConnection | null = null;
  private static connectionMult: IConnection | null = null;
  private static connectionType: ConnectionType = stryMutAct_9fa48("1236") ? "" : (stryCov_9fa48("1236"), 'odbc');
  private static useMockData: boolean = stryMutAct_9fa48("1237") ? true : (stryCov_9fa48("1237"), false);
  private static connectionError: string | null = null;
  private static isInitialized: boolean = stryMutAct_9fa48("1238") ? true : (stryCov_9fa48("1238"), false);
  private static initializationPromise: Promise<void> | null = null;

  // Construtor privado para padrão Singleton
  private constructor() {}

  /**
   * ✅ NOVO: Retorna instância singleton
   * Usado pelo health check no app.ts
   */
  static getInstance(): DatabaseManager {
    if (stryMutAct_9fa48("1239")) {
      {}
    } else {
      stryCov_9fa48("1239");
      if (stryMutAct_9fa48("1242") ? false : stryMutAct_9fa48("1241") ? true : stryMutAct_9fa48("1240") ? this.instance : (stryCov_9fa48("1240", "1241", "1242"), !this.instance)) {
        if (stryMutAct_9fa48("1243")) {
          {}
        } else {
          stryCov_9fa48("1243");
          this.instance = new DatabaseManager();
        }
      }
      return this.instance;
    }
  }

  /**
   * ✅ NOVO: Retorna a conexão primária (EMP)
   * Usado pelo health check no app.ts
   */
  static getConnection(): IConnection {
    if (stryMutAct_9fa48("1244")) {
      {}
    } else {
      stryCov_9fa48("1244");
      if (stryMutAct_9fa48("1246") ? false : stryMutAct_9fa48("1245") ? true : (stryCov_9fa48("1245", "1246"), this.useMockData)) {
        if (stryMutAct_9fa48("1247")) {
          {}
        } else {
          stryCov_9fa48("1247");
          return this.getMockConnection();
        }
      }
      if (stryMutAct_9fa48("1250") ? false : stryMutAct_9fa48("1249") ? true : stryMutAct_9fa48("1248") ? this.connectionEmp : (stryCov_9fa48("1248", "1249", "1250"), !this.connectionEmp)) {
        if (stryMutAct_9fa48("1251")) {
          {}
        } else {
          stryCov_9fa48("1251");
          throw new Error(stryMutAct_9fa48("1252") ? "" : (stryCov_9fa48("1252"), 'Conexão EMP não inicializada'));
        }
      }
      return this.connectionEmp;
    }
  }
  static async initialize(): Promise<void> {
    if (stryMutAct_9fa48("1253")) {
      {}
    } else {
      stryCov_9fa48("1253");
      if (stryMutAct_9fa48("1255") ? false : stryMutAct_9fa48("1254") ? true : (stryCov_9fa48("1254", "1255"), this.initializationPromise)) {
        if (stryMutAct_9fa48("1256")) {
          {}
        } else {
          stryCov_9fa48("1256");
          return this.initializationPromise;
        }
      }
      if (stryMutAct_9fa48("1258") ? false : stryMutAct_9fa48("1257") ? true : (stryCov_9fa48("1257", "1258"), this.isInitialized)) {
        if (stryMutAct_9fa48("1259")) {
          {}
        } else {
          stryCov_9fa48("1259");
          return Promise.resolve();
        }
      }
      this.initializationPromise = this.doInitialize();
      try {
        if (stryMutAct_9fa48("1260")) {
          {}
        } else {
          stryCov_9fa48("1260");
          await this.initializationPromise;
        }
      } finally {
        if (stryMutAct_9fa48("1261")) {
          {}
        } else {
          stryCov_9fa48("1261");
          this.initializationPromise = null;
        }
      }
    }
  }
  private static async doInitialize(): Promise<void> {
    if (stryMutAct_9fa48("1262")) {
      {}
    } else {
      stryCov_9fa48("1262");
      console.log(stryMutAct_9fa48("1263") ? "" : (stryCov_9fa48("1263"), 'Inicializando conexoes Datasul...'));
      this.connectionType = stryMutAct_9fa48("1266") ? process.env.DB_CONNECTION_TYPE as ConnectionType && 'odbc' : stryMutAct_9fa48("1265") ? false : stryMutAct_9fa48("1264") ? true : (stryCov_9fa48("1264", "1265", "1266"), process.env.DB_CONNECTION_TYPE as ConnectionType || (stryMutAct_9fa48("1267") ? "" : (stryCov_9fa48("1267"), 'odbc')));
      console.log(stryMutAct_9fa48("1268") ? `` : (stryCov_9fa48("1268"), `Modo: ${stryMutAct_9fa48("1269") ? this.connectionType.toLowerCase() : (stryCov_9fa48("1269"), this.connectionType.toUpperCase())}`));
      try {
        if (stryMutAct_9fa48("1270")) {
          {}
        } else {
          stryCov_9fa48("1270");
          if (stryMutAct_9fa48("1273") ? this.connectionType !== 'odbc' : stryMutAct_9fa48("1272") ? false : stryMutAct_9fa48("1271") ? true : (stryCov_9fa48("1271", "1272", "1273"), this.connectionType === (stryMutAct_9fa48("1274") ? "" : (stryCov_9fa48("1274"), 'odbc')))) {
            if (stryMutAct_9fa48("1275")) {
              {}
            } else {
              stryCov_9fa48("1275");
              await this.initializeOdbc();
            }
          } else {
            if (stryMutAct_9fa48("1276")) {
              {}
            } else {
              stryCov_9fa48("1276");
              await this.initializeSqlServer();
            }
          }
          this.useMockData = stryMutAct_9fa48("1277") ? true : (stryCov_9fa48("1277"), false);
          this.isInitialized = stryMutAct_9fa48("1278") ? false : (stryCov_9fa48("1278"), true);

          // ✅ NOVO: Registrar métricas de conexão bem-sucedida
          DatabaseMetricsHelper.setActiveConnections(stryMutAct_9fa48("1279") ? "" : (stryCov_9fa48("1279"), 'EMP'), 1);
          DatabaseMetricsHelper.setActiveConnections(stryMutAct_9fa48("1280") ? "" : (stryCov_9fa48("1280"), 'MULT'), 1);
          console.log(stryMutAct_9fa48("1281") ? "" : (stryCov_9fa48("1281"), '✅ CONECTADO AO DATASUL'));
        }
      } catch (error) {
        if (stryMutAct_9fa48("1282")) {
          {}
        } else {
          stryCov_9fa48("1282");
          this.connectionError = (error as Error).message;
          this.useMockData = stryMutAct_9fa48("1283") ? false : (stryCov_9fa48("1283"), true);
          this.isInitialized = stryMutAct_9fa48("1284") ? false : (stryCov_9fa48("1284"), true);

          // ✅ NOVO: Registrar erro de conexão nas métricas
          DatabaseMetricsHelper.recordConnectionError(stryMutAct_9fa48("1285") ? "" : (stryCov_9fa48("1285"), 'EMP'), error);
          DatabaseMetricsHelper.recordConnectionError(stryMutAct_9fa48("1286") ? "" : (stryCov_9fa48("1286"), 'MULT'), error);
          console.warn(stryMutAct_9fa48("1287") ? "" : (stryCov_9fa48("1287"), '⚠️ USANDO DADOS MOCK'));
          console.error(stryMutAct_9fa48("1288") ? "" : (stryCov_9fa48("1288"), 'Erro conexão:'), this.connectionError);
        }
      }
    }
  }
  private static async initializeSqlServer(): Promise<void> {
    if (stryMutAct_9fa48("1289")) {
      {}
    } else {
      stryCov_9fa48("1289");
      const configEmp = getSqlServerConfigEmp();
      const configMult = getSqlServerConfigMult();
      this.connectionEmp = new SqlServerConnection(configEmp, stryMutAct_9fa48("1290") ? "" : (stryCov_9fa48("1290"), 'EMP'));
      this.connectionMult = new SqlServerConnection(configMult, stryMutAct_9fa48("1291") ? "" : (stryCov_9fa48("1291"), 'MULT'));
      await Promise.all(stryMutAct_9fa48("1292") ? [] : (stryCov_9fa48("1292"), [this.connectionEmp.connect(), this.connectionMult.connect()]));
      console.log(stryMutAct_9fa48("1293") ? "" : (stryCov_9fa48("1293"), '✅ SQL Server conectado'));
    }
  }
  private static async initializeOdbc(): Promise<void> {
    if (stryMutAct_9fa48("1294")) {
      {}
    } else {
      stryCov_9fa48("1294");
      const connStringEmp = getOdbcConnectionString(stryMutAct_9fa48("1295") ? "" : (stryCov_9fa48("1295"), 'EMP'));
      const connStringMult = getOdbcConnectionString(stryMutAct_9fa48("1296") ? "" : (stryCov_9fa48("1296"), 'MULT'));
      this.connectionEmp = new OdbcConnection(connStringEmp, stryMutAct_9fa48("1297") ? "" : (stryCov_9fa48("1297"), 'EMP'));
      this.connectionMult = new OdbcConnection(connStringMult, stryMutAct_9fa48("1298") ? "" : (stryCov_9fa48("1298"), 'MULT'));
      await Promise.all(stryMutAct_9fa48("1299") ? [] : (stryCov_9fa48("1299"), [this.connectionEmp.connect(), this.connectionMult.connect()]));
      console.log(stryMutAct_9fa48("1300") ? "" : (stryCov_9fa48("1300"), '✅ ODBC conectado'));
    }
  }

  /**
   * Query simples EMP (DEPRECATED - Use queryEmpWithParams quando possível)
   * ✅ COM MÉTRICAS
   */
  static async queryEmp(sql: string): Promise<any> {
    if (stryMutAct_9fa48("1301")) {
      {}
    } else {
      stryCov_9fa48("1301");
      if (stryMutAct_9fa48("1303") ? false : stryMutAct_9fa48("1302") ? true : (stryCov_9fa48("1302", "1303"), this.useMockData)) {
        if (stryMutAct_9fa48("1304")) {
          {}
        } else {
          stryCov_9fa48("1304");
          return this.getMockConnection().query(sql);
        }
      }
      if (stryMutAct_9fa48("1307") ? false : stryMutAct_9fa48("1306") ? true : stryMutAct_9fa48("1305") ? this.connectionEmp : (stryCov_9fa48("1305", "1306", "1307"), !this.connectionEmp)) {
        if (stryMutAct_9fa48("1308")) {
          {}
        } else {
          stryCov_9fa48("1308");
          throw new Error(stryMutAct_9fa48("1309") ? "" : (stryCov_9fa48("1309"), 'Conexão EMP não inicializada'));
        }
      }

      // ✅ NOVO: Instrumentar com métricas
      return DatabaseMetricsHelper.instrumentQuery(stryMutAct_9fa48("1310") ? "" : (stryCov_9fa48("1310"), 'EMP'), sql, stryMutAct_9fa48("1311") ? () => undefined : (stryCov_9fa48("1311"), () => this.connectionEmp!.query(sql)));
    }
  }

  /**
   * Query simples MULT (DEPRECATED - Use queryMultWithParams quando possível)
   * ✅ COM MÉTRICAS
   */
  static async queryMult(sql: string): Promise<any> {
    if (stryMutAct_9fa48("1312")) {
      {}
    } else {
      stryCov_9fa48("1312");
      if (stryMutAct_9fa48("1314") ? false : stryMutAct_9fa48("1313") ? true : (stryCov_9fa48("1313", "1314"), this.useMockData)) {
        if (stryMutAct_9fa48("1315")) {
          {}
        } else {
          stryCov_9fa48("1315");
          return this.getMockConnection().query(sql);
        }
      }
      if (stryMutAct_9fa48("1318") ? false : stryMutAct_9fa48("1317") ? true : stryMutAct_9fa48("1316") ? this.connectionMult : (stryCov_9fa48("1316", "1317", "1318"), !this.connectionMult)) {
        if (stryMutAct_9fa48("1319")) {
          {}
        } else {
          stryCov_9fa48("1319");
          throw new Error(stryMutAct_9fa48("1320") ? "" : (stryCov_9fa48("1320"), 'Conexão MULT não inicializada'));
        }
      }

      // ✅ NOVO: Instrumentar com métricas
      return DatabaseMetricsHelper.instrumentQuery(stryMutAct_9fa48("1321") ? "" : (stryCov_9fa48("1321"), 'MULT'), sql, stryMutAct_9fa48("1322") ? () => undefined : (stryCov_9fa48("1322"), () => this.connectionMult!.query(sql)));
    }
  }

  /**
   * Query parametrizada EMP (✅ PROTEGIDO contra SQL Injection)
   * ✅ COM MÉTRICAS
   */
  static async queryEmpWithParams(sql: string, params: QueryParameter[]): Promise<any> {
    if (stryMutAct_9fa48("1323")) {
      {}
    } else {
      stryCov_9fa48("1323");
      if (stryMutAct_9fa48("1325") ? false : stryMutAct_9fa48("1324") ? true : (stryCov_9fa48("1324", "1325"), this.useMockData)) {
        if (stryMutAct_9fa48("1326")) {
          {}
        } else {
          stryCov_9fa48("1326");
          return this.getMockConnection().queryWithParams(sql, params);
        }
      }
      if (stryMutAct_9fa48("1329") ? false : stryMutAct_9fa48("1328") ? true : stryMutAct_9fa48("1327") ? this.connectionEmp : (stryCov_9fa48("1327", "1328", "1329"), !this.connectionEmp)) {
        if (stryMutAct_9fa48("1330")) {
          {}
        } else {
          stryCov_9fa48("1330");
          throw new Error(stryMutAct_9fa48("1331") ? "" : (stryCov_9fa48("1331"), 'Conexão EMP não inicializada'));
        }
      }

      // ✅ NOVO: Instrumentar com métricas
      return DatabaseMetricsHelper.instrumentQuery(stryMutAct_9fa48("1332") ? "" : (stryCov_9fa48("1332"), 'EMP'), sql, stryMutAct_9fa48("1333") ? () => undefined : (stryCov_9fa48("1333"), () => this.connectionEmp!.queryWithParams(sql, params)));
    }
  }

  /**
   * Query parametrizada MULT (✅ PROTEGIDO contra SQL Injection)
   * ✅ COM MÉTRICAS
   */
  static async queryMultWithParams(sql: string, params: QueryParameter[]): Promise<any> {
    if (stryMutAct_9fa48("1334")) {
      {}
    } else {
      stryCov_9fa48("1334");
      if (stryMutAct_9fa48("1336") ? false : stryMutAct_9fa48("1335") ? true : (stryCov_9fa48("1335", "1336"), this.useMockData)) {
        if (stryMutAct_9fa48("1337")) {
          {}
        } else {
          stryCov_9fa48("1337");
          return this.getMockConnection().queryWithParams(sql, params);
        }
      }
      if (stryMutAct_9fa48("1340") ? false : stryMutAct_9fa48("1339") ? true : stryMutAct_9fa48("1338") ? this.connectionMult : (stryCov_9fa48("1338", "1339", "1340"), !this.connectionMult)) {
        if (stryMutAct_9fa48("1341")) {
          {}
        } else {
          stryCov_9fa48("1341");
          throw new Error(stryMutAct_9fa48("1342") ? "" : (stryCov_9fa48("1342"), 'Conexão MULT não inicializada'));
        }
      }

      // ✅ NOVO: Instrumentar com métricas
      return DatabaseMetricsHelper.instrumentQuery(stryMutAct_9fa48("1343") ? "" : (stryCov_9fa48("1343"), 'MULT'), sql, stryMutAct_9fa48("1344") ? () => undefined : (stryCov_9fa48("1344"), () => this.connectionMult!.queryWithParams(sql, params)));
    }
  }
  private static getMockConnection(): IConnection {
    if (stryMutAct_9fa48("1345")) {
      {}
    } else {
      stryCov_9fa48("1345");
      return new MockConnection();
    }
  }
  static getConnectionStatus(): ConnectionStatus {
    if (stryMutAct_9fa48("1346")) {
      {}
    } else {
      stryCov_9fa48("1346");
      return stryMutAct_9fa48("1347") ? {} : (stryCov_9fa48("1347"), {
        type: this.connectionType,
        mode: this.useMockData ? stryMutAct_9fa48("1348") ? "" : (stryCov_9fa48("1348"), 'MOCK_DATA') : stryMutAct_9fa48("1349") ? "" : (stryCov_9fa48("1349"), 'REAL_DATABASE'),
        error: stryMutAct_9fa48("1352") ? this.connectionError && undefined : stryMutAct_9fa48("1351") ? false : stryMutAct_9fa48("1350") ? true : (stryCov_9fa48("1350", "1351", "1352"), this.connectionError || undefined)
      });
    }
  }
  static isReady(): boolean {
    if (stryMutAct_9fa48("1353")) {
      {}
    } else {
      stryCov_9fa48("1353");
      return this.isInitialized;
    }
  }
  static async close(): Promise<void> {
    if (stryMutAct_9fa48("1354")) {
      {}
    } else {
      stryCov_9fa48("1354");
      const promises: Promise<void>[] = stryMutAct_9fa48("1355") ? ["Stryker was here"] : (stryCov_9fa48("1355"), []);
      if (stryMutAct_9fa48("1357") ? false : stryMutAct_9fa48("1356") ? true : (stryCov_9fa48("1356", "1357"), this.connectionEmp)) {
        if (stryMutAct_9fa48("1358")) {
          {}
        } else {
          stryCov_9fa48("1358");
          promises.push(this.connectionEmp.close());
        }
      }
      if (stryMutAct_9fa48("1360") ? false : stryMutAct_9fa48("1359") ? true : (stryCov_9fa48("1359", "1360"), this.connectionMult)) {
        if (stryMutAct_9fa48("1361")) {
          {}
        } else {
          stryCov_9fa48("1361");
          promises.push(this.connectionMult.close());
        }
      }
      await Promise.all(promises);

      // ✅ NOVO: Atualizar métricas de conexão
      DatabaseMetricsHelper.setActiveConnections(stryMutAct_9fa48("1362") ? "" : (stryCov_9fa48("1362"), 'EMP'), 0);
      DatabaseMetricsHelper.setActiveConnections(stryMutAct_9fa48("1363") ? "" : (stryCov_9fa48("1363"), 'MULT'), 0);
      this.connectionEmp = null;
      this.connectionMult = null;
      this.isInitialized = stryMutAct_9fa48("1364") ? true : (stryCov_9fa48("1364"), false);
      console.log(stryMutAct_9fa48("1365") ? "" : (stryCov_9fa48("1365"), '🔌 Conexões fechadas'));
    }
  }

  // Métodos legados para compatibilidade
  static getConnectionEmp(): IConnection {
    if (stryMutAct_9fa48("1366")) {
      {}
    } else {
      stryCov_9fa48("1366");
      if (stryMutAct_9fa48("1369") ? false : stryMutAct_9fa48("1368") ? true : stryMutAct_9fa48("1367") ? this.connectionEmp : (stryCov_9fa48("1367", "1368", "1369"), !this.connectionEmp)) {
        if (stryMutAct_9fa48("1370")) {
          {}
        } else {
          stryCov_9fa48("1370");
          throw new Error(stryMutAct_9fa48("1371") ? "" : (stryCov_9fa48("1371"), 'Conexão EMP não inicializada'));
        }
      }
      return this.connectionEmp;
    }
  }
  static getConnectionMult(): IConnection {
    if (stryMutAct_9fa48("1372")) {
      {}
    } else {
      stryCov_9fa48("1372");
      if (stryMutAct_9fa48("1375") ? false : stryMutAct_9fa48("1374") ? true : stryMutAct_9fa48("1373") ? this.connectionMult : (stryCov_9fa48("1373", "1374", "1375"), !this.connectionMult)) {
        if (stryMutAct_9fa48("1376")) {
          {}
        } else {
          stryCov_9fa48("1376");
          throw new Error(stryMutAct_9fa48("1377") ? "" : (stryCov_9fa48("1377"), 'Conexão MULT não inicializada'));
        }
      }
      return this.connectionMult;
    }
  }
}