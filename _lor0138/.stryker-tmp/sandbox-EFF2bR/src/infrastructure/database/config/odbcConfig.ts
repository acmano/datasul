// @ts-nocheck
// src/infrastructure/database/config/odbcConfig.ts
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
export interface OdbcConfig {
  connectionString: string;
  connectionTimeout: number; // milissegundos
  commandTimeout: number; // milissegundos
}

/**
 * Retorna connection string ODBC para o database especificado
 */
export const getOdbcConnectionString = (database: 'EMP' | 'MULT'): string => {
  if (stryMutAct_9fa48("1378")) {
    {}
  } else {
    stryCov_9fa48("1378");
    const dsnName = (stryMutAct_9fa48("1381") ? database !== 'EMP' : stryMutAct_9fa48("1380") ? false : stryMutAct_9fa48("1379") ? true : (stryCov_9fa48("1379", "1380", "1381"), database === (stryMutAct_9fa48("1382") ? "" : (stryCov_9fa48("1382"), 'EMP')))) ? stryMutAct_9fa48("1385") ? process.env.ODBC_DSN_EMP && 'PRD_EMS2EMP' : stryMutAct_9fa48("1384") ? false : stryMutAct_9fa48("1383") ? true : (stryCov_9fa48("1383", "1384", "1385"), process.env.ODBC_DSN_EMP || (stryMutAct_9fa48("1386") ? "" : (stryCov_9fa48("1386"), 'PRD_EMS2EMP'))) : stryMutAct_9fa48("1389") ? process.env.ODBC_DSN_MULT && 'PRD_EMS2MULT' : stryMutAct_9fa48("1388") ? false : stryMutAct_9fa48("1387") ? true : (stryCov_9fa48("1387", "1388", "1389"), process.env.ODBC_DSN_MULT || (stryMutAct_9fa48("1390") ? "" : (stryCov_9fa48("1390"), 'PRD_EMS2MULT')));
    const user = stryMutAct_9fa48("1393") ? (process.env.ODBC_USER || process.env.DB_USER) && '' : stryMutAct_9fa48("1392") ? false : stryMutAct_9fa48("1391") ? true : (stryCov_9fa48("1391", "1392", "1393"), (stryMutAct_9fa48("1395") ? process.env.ODBC_USER && process.env.DB_USER : stryMutAct_9fa48("1394") ? false : (stryCov_9fa48("1394", "1395"), process.env.ODBC_USER || process.env.DB_USER)) || (stryMutAct_9fa48("1396") ? "Stryker was here!" : (stryCov_9fa48("1396"), '')));
    const password = stryMutAct_9fa48("1399") ? (process.env.ODBC_PASSWORD || process.env.DB_PASSWORD) && '' : stryMutAct_9fa48("1398") ? false : stryMutAct_9fa48("1397") ? true : (stryCov_9fa48("1397", "1398", "1399"), (stryMutAct_9fa48("1401") ? process.env.ODBC_PASSWORD && process.env.DB_PASSWORD : stryMutAct_9fa48("1400") ? false : (stryCov_9fa48("1400", "1401"), process.env.ODBC_PASSWORD || process.env.DB_PASSWORD)) || (stryMutAct_9fa48("1402") ? "Stryker was here!" : (stryCov_9fa48("1402"), '')));
    return stryMutAct_9fa48("1403") ? `` : (stryCov_9fa48("1403"), `DSN=${dsnName};UID=${user};PWD=${password}`);
  }
};

/**
 * ✅ NOVO: Retorna configuração completa com timeouts
 */
export const getOdbcConfig = (database: 'EMP' | 'MULT'): OdbcConfig => {
  if (stryMutAct_9fa48("1404")) {
    {}
  } else {
    stryCov_9fa48("1404");
    const connectionString = getOdbcConnectionString(database);

    // ✅ IMPORTANTE: Usa parseInt() direto, então .env deve ter milissegundos puros
    const connectionTimeout = parseInt(stryMutAct_9fa48("1407") ? process.env.ODBC_CONNECTION_TIMEOUT && '15000' : stryMutAct_9fa48("1406") ? false : stryMutAct_9fa48("1405") ? true : (stryCov_9fa48("1405", "1406", "1407"), process.env.ODBC_CONNECTION_TIMEOUT || (stryMutAct_9fa48("1408") ? "" : (stryCov_9fa48("1408"), '15000'))), 10);
    const commandTimeout = parseInt(stryMutAct_9fa48("1411") ? process.env.ODBC_COMMAND_TIMEOUT && '30000' : stryMutAct_9fa48("1410") ? false : stryMutAct_9fa48("1409") ? true : (stryCov_9fa48("1409", "1410", "1411"), process.env.ODBC_COMMAND_TIMEOUT || (stryMutAct_9fa48("1412") ? "" : (stryCov_9fa48("1412"), '30000'))), 10);
    return stryMutAct_9fa48("1413") ? {} : (stryCov_9fa48("1413"), {
      connectionString,
      connectionTimeout,
      commandTimeout
    });
  }
};

/**
 * Valida configuração ODBC
 */
export const validateOdbcConfig = (): void => {
  if (stryMutAct_9fa48("1414")) {
    {}
  } else {
    stryCov_9fa48("1414");
    const requiredVars = stryMutAct_9fa48("1415") ? [] : (stryCov_9fa48("1415"), [stryMutAct_9fa48("1416") ? "" : (stryCov_9fa48("1416"), 'DB_USER'), stryMutAct_9fa48("1417") ? "" : (stryCov_9fa48("1417"), 'DB_PASSWORD')]);
    for (const varName of requiredVars) {
      if (stryMutAct_9fa48("1418")) {
        {}
      } else {
        stryCov_9fa48("1418");
        if (stryMutAct_9fa48("1421") ? false : stryMutAct_9fa48("1420") ? true : stryMutAct_9fa48("1419") ? process.env[varName] : (stryCov_9fa48("1419", "1420", "1421"), !process.env[varName])) {
          if (stryMutAct_9fa48("1422")) {
            {}
          } else {
            stryCov_9fa48("1422");
            throw new Error(stryMutAct_9fa48("1423") ? `` : (stryCov_9fa48("1423"), `Variável de ambiente obrigatória não encontrada: ${varName}`));
          }
        }
      }
    }

    // Verifica timeouts
    const connectionTimeout = parseInt(stryMutAct_9fa48("1426") ? process.env.ODBC_CONNECTION_TIMEOUT && '15000' : stryMutAct_9fa48("1425") ? false : stryMutAct_9fa48("1424") ? true : (stryCov_9fa48("1424", "1425", "1426"), process.env.ODBC_CONNECTION_TIMEOUT || (stryMutAct_9fa48("1427") ? "" : (stryCov_9fa48("1427"), '15000'))), 10);
    const commandTimeout = parseInt(stryMutAct_9fa48("1430") ? process.env.ODBC_COMMAND_TIMEOUT && '30000' : stryMutAct_9fa48("1429") ? false : stryMutAct_9fa48("1428") ? true : (stryCov_9fa48("1428", "1429", "1430"), process.env.ODBC_COMMAND_TIMEOUT || (stryMutAct_9fa48("1431") ? "" : (stryCov_9fa48("1431"), '30000'))), 10);
    if (stryMutAct_9fa48("1434") ? isNaN(connectionTimeout) && connectionTimeout < 1000 : stryMutAct_9fa48("1433") ? false : stryMutAct_9fa48("1432") ? true : (stryCov_9fa48("1432", "1433", "1434"), isNaN(connectionTimeout) || (stryMutAct_9fa48("1437") ? connectionTimeout >= 1000 : stryMutAct_9fa48("1436") ? connectionTimeout <= 1000 : stryMutAct_9fa48("1435") ? false : (stryCov_9fa48("1435", "1436", "1437"), connectionTimeout < 1000)))) {
      if (stryMutAct_9fa48("1438")) {
        {}
      } else {
        stryCov_9fa48("1438");
        throw new Error(stryMutAct_9fa48("1439") ? `` : (stryCov_9fa48("1439"), `ODBC_CONNECTION_TIMEOUT inválido: deve ser >= 1000ms (recebido: ${process.env.ODBC_CONNECTION_TIMEOUT})`));
      }
    }
    if (stryMutAct_9fa48("1442") ? isNaN(commandTimeout) && commandTimeout < 1000 : stryMutAct_9fa48("1441") ? false : stryMutAct_9fa48("1440") ? true : (stryCov_9fa48("1440", "1441", "1442"), isNaN(commandTimeout) || (stryMutAct_9fa48("1445") ? commandTimeout >= 1000 : stryMutAct_9fa48("1444") ? commandTimeout <= 1000 : stryMutAct_9fa48("1443") ? false : (stryCov_9fa48("1443", "1444", "1445"), commandTimeout < 1000)))) {
      if (stryMutAct_9fa48("1446")) {
        {}
      } else {
        stryCov_9fa48("1446");
        throw new Error(stryMutAct_9fa48("1447") ? `` : (stryCov_9fa48("1447"), `ODBC_COMMAND_TIMEOUT inválido: deve ser >= 1000ms (recebido: ${process.env.ODBC_COMMAND_TIMEOUT})`));
      }
    }
  }
};