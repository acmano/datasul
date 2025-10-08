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
import { config } from '@config/env.config';
export function getSqlServerConfigEmp(): DatabaseConfig {
  if (stryMutAct_9fa48("1492")) {
    {}
  } else {
    stryCov_9fa48("1492");
    const dbConfig = config.database.sqlServer;
    return stryMutAct_9fa48("1493") ? {} : (stryCov_9fa48("1493"), {
      server: dbConfig.server,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.databaseEmp,
      connectionTimeout: dbConfig.connectionTimeout,
      requestTimeout: dbConfig.requestTimeout,
      encrypt: dbConfig.encrypt,
      trustServerCertificate: dbConfig.trustServerCertificate
    });
  }
}
export function getSqlServerConfigMult(): DatabaseConfig {
  if (stryMutAct_9fa48("1494")) {
    {}
  } else {
    stryCov_9fa48("1494");
    const dbConfig = config.database.sqlServer;
    return stryMutAct_9fa48("1495") ? {} : (stryCov_9fa48("1495"), {
      server: dbConfig.server,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.databaseMult,
      connectionTimeout: dbConfig.connectionTimeout,
      requestTimeout: dbConfig.requestTimeout,
      encrypt: dbConfig.encrypt,
      trustServerCertificate: dbConfig.trustServerCertificate
    });
  }
}