// @ts-nocheck
// src/config/app.config.ts
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
export const appConfig = stryMutAct_9fa48("608") ? {} : (stryCov_9fa48("608"), {
  host: stryMutAct_9fa48("611") ? process.env.APP_HOST && 'lor0138.lorenzetti.ibe' : stryMutAct_9fa48("610") ? false : stryMutAct_9fa48("609") ? true : (stryCov_9fa48("609", "610", "611"), process.env.APP_HOST || (stryMutAct_9fa48("612") ? "" : (stryCov_9fa48("612"), 'lor0138.lorenzetti.ibe'))),
  port: parseInt(stryMutAct_9fa48("615") ? process.env.APP_PORT && '3000' : stryMutAct_9fa48("614") ? false : stryMutAct_9fa48("613") ? true : (stryCov_9fa48("613", "614", "615"), process.env.APP_PORT || (stryMutAct_9fa48("616") ? "" : (stryCov_9fa48("616"), '3000'))), 10),
  url: stryMutAct_9fa48("619") ? process.env.APP_URL && 'http://lor0138.lorenzetti.ibe:3000' : stryMutAct_9fa48("618") ? false : stryMutAct_9fa48("617") ? true : (stryCov_9fa48("617", "618", "619"), process.env.APP_URL || (stryMutAct_9fa48("620") ? "" : (stryCov_9fa48("620"), 'http://lor0138.lorenzetti.ibe:3000'))),
  // Garantir que NUNCA seja localhost
  get baseUrl(): string {
    if (stryMutAct_9fa48("621")) {
      {}
    } else {
      stryCov_9fa48("621");
      if (stryMutAct_9fa48("623") ? false : stryMutAct_9fa48("622") ? true : (stryCov_9fa48("622", "623"), this.url.includes(stryMutAct_9fa48("624") ? "" : (stryCov_9fa48("624"), 'localhost')))) {
        if (stryMutAct_9fa48("625")) {
          {}
        } else {
          stryCov_9fa48("625");
          throw new Error(stryMutAct_9fa48("626") ? "" : (stryCov_9fa48("626"), 'ERRO: localhost não é permitido. Use lor0138.lorenzetti.ibe'));
        }
      }
      return this.url;
    }
  }
});