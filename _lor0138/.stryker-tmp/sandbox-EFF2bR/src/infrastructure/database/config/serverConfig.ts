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
import { DatabaseConfig } from '../types';
export function getSqlServerConfigEmp(): DatabaseConfig {
  if (stryMutAct_9fa48("1448")) {
    {}
  } else {
    stryCov_9fa48("1448");
    const config = stryMutAct_9fa48("1449") ? {} : (stryCov_9fa48("1449"), {
      server: stryMutAct_9fa48("1452") ? process.env.DB_SERVER && '' : stryMutAct_9fa48("1451") ? false : stryMutAct_9fa48("1450") ? true : (stryCov_9fa48("1450", "1451", "1452"), process.env.DB_SERVER || (stryMutAct_9fa48("1453") ? "Stryker was here!" : (stryCov_9fa48("1453"), ''))),
      port: parseInt(stryMutAct_9fa48("1456") ? process.env.DB_PORT && '1433' : stryMutAct_9fa48("1455") ? false : stryMutAct_9fa48("1454") ? true : (stryCov_9fa48("1454", "1455", "1456"), process.env.DB_PORT || (stryMutAct_9fa48("1457") ? "" : (stryCov_9fa48("1457"), '1433'))), 10),
      user: stryMutAct_9fa48("1460") ? process.env.DB_USER && '' : stryMutAct_9fa48("1459") ? false : stryMutAct_9fa48("1458") ? true : (stryCov_9fa48("1458", "1459", "1460"), process.env.DB_USER || (stryMutAct_9fa48("1461") ? "Stryker was here!" : (stryCov_9fa48("1461"), ''))),
      password: stryMutAct_9fa48("1464") ? process.env.DB_PASSWORD && '' : stryMutAct_9fa48("1463") ? false : stryMutAct_9fa48("1462") ? true : (stryCov_9fa48("1462", "1463", "1464"), process.env.DB_PASSWORD || (stryMutAct_9fa48("1465") ? "Stryker was here!" : (stryCov_9fa48("1465"), ''))),
      database: stryMutAct_9fa48("1468") ? process.env.DB_DATABASE_EMP && '' : stryMutAct_9fa48("1467") ? false : stryMutAct_9fa48("1466") ? true : (stryCov_9fa48("1466", "1467", "1468"), process.env.DB_DATABASE_EMP || (stryMutAct_9fa48("1469") ? "Stryker was here!" : (stryCov_9fa48("1469"), ''))),
      connectionTimeout: parseInt(stryMutAct_9fa48("1472") ? process.env.DB_CONNECTION_TIMEOUT && '30000' : stryMutAct_9fa48("1471") ? false : stryMutAct_9fa48("1470") ? true : (stryCov_9fa48("1470", "1471", "1472"), process.env.DB_CONNECTION_TIMEOUT || (stryMutAct_9fa48("1473") ? "" : (stryCov_9fa48("1473"), '30000'))), 10),
      requestTimeout: parseInt(stryMutAct_9fa48("1476") ? process.env.DB_REQUEST_TIMEOUT && '30000' : stryMutAct_9fa48("1475") ? false : stryMutAct_9fa48("1474") ? true : (stryCov_9fa48("1474", "1475", "1476"), process.env.DB_REQUEST_TIMEOUT || (stryMutAct_9fa48("1477") ? "" : (stryCov_9fa48("1477"), '30000'))), 10),
      encrypt: stryMutAct_9fa48("1480") ? process.env.DB_ENCRYPT !== 'true' : stryMutAct_9fa48("1479") ? false : stryMutAct_9fa48("1478") ? true : (stryCov_9fa48("1478", "1479", "1480"), process.env.DB_ENCRYPT === (stryMutAct_9fa48("1481") ? "" : (stryCov_9fa48("1481"), 'true'))),
      trustServerCertificate: stryMutAct_9fa48("1484") ? process.env.DB_TRUST_SERVER_CERTIFICATE !== 'true' : stryMutAct_9fa48("1483") ? false : stryMutAct_9fa48("1482") ? true : (stryCov_9fa48("1482", "1483", "1484"), process.env.DB_TRUST_SERVER_CERTIFICATE === (stryMutAct_9fa48("1485") ? "" : (stryCov_9fa48("1485"), 'true')))
    });
    return config;
  }
}
export function getSqlServerConfigMult(): DatabaseConfig {
  if (stryMutAct_9fa48("1486")) {
    {}
  } else {
    stryCov_9fa48("1486");
    return stryMutAct_9fa48("1487") ? {} : (stryCov_9fa48("1487"), {
      ...getSqlServerConfigEmp(),
      database: stryMutAct_9fa48("1490") ? process.env.DB_DATABASE_MULT && '' : stryMutAct_9fa48("1489") ? false : stryMutAct_9fa48("1488") ? true : (stryCov_9fa48("1488", "1489", "1490"), process.env.DB_DATABASE_MULT || (stryMutAct_9fa48("1491") ? "Stryker was here!" : (stryCov_9fa48("1491"), '')))
    });
  }
}