// @ts-nocheck
// src/shared/middlewares/cachePresets.ts
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
import { cacheMiddleware } from './cache.middleware';
export const healthCache = cacheMiddleware(stryMutAct_9fa48("2499") ? {} : (stryCov_9fa48("2499"), {
  ttl: parseInt(stryMutAct_9fa48("2502") ? process.env.CACHE_HEALTH_TTL && '30' : stryMutAct_9fa48("2501") ? false : stryMutAct_9fa48("2500") ? true : (stryCov_9fa48("2500", "2501", "2502"), process.env.CACHE_HEALTH_TTL || (stryMutAct_9fa48("2503") ? "" : (stryCov_9fa48("2503"), '30'))), 10)
}));
export const itemCache = cacheMiddleware(stryMutAct_9fa48("2504") ? {} : (stryCov_9fa48("2504"), {
  ttl: parseInt(stryMutAct_9fa48("2507") ? process.env.CACHE_ITEM_TTL && '600' : stryMutAct_9fa48("2506") ? false : stryMutAct_9fa48("2505") ? true : (stryCov_9fa48("2505", "2506", "2507"), process.env.CACHE_ITEM_TTL || (stryMutAct_9fa48("2508") ? "" : (stryCov_9fa48("2508"), '600'))), 10)
}));
export const estabelecimentoCache = cacheMiddleware(stryMutAct_9fa48("2509") ? {} : (stryCov_9fa48("2509"), {
  ttl: parseInt(stryMutAct_9fa48("2512") ? process.env.CACHE_ESTABELECIMENTO_TTL && '900' : stryMutAct_9fa48("2511") ? false : stryMutAct_9fa48("2510") ? true : (stryCov_9fa48("2510", "2511", "2512"), process.env.CACHE_ESTABELECIMENTO_TTL || (stryMutAct_9fa48("2513") ? "" : (stryCov_9fa48("2513"), '900'))), 10)
}));