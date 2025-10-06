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
import { IConnection, QueryParameter } from '../types';
export class MockConnection implements IConnection {
  private mockData = stryMutAct_9fa48("1496") ? {} : (stryCov_9fa48("1496"), {
    item: stryMutAct_9fa48("1497") ? {} : (stryCov_9fa48("1497"), {
      itemCodigo: stryMutAct_9fa48("1498") ? "" : (stryCov_9fa48("1498"), 'MOCK001'),
      itemDescricao: stryMutAct_9fa48("1499") ? "" : (stryCov_9fa48("1499"), 'Item Mock para Testes'),
      itemUnidade: stryMutAct_9fa48("1500") ? "" : (stryCov_9fa48("1500"), 'UN')
    }),
    estabelecimentos: stryMutAct_9fa48("1501") ? [] : (stryCov_9fa48("1501"), [stryMutAct_9fa48("1502") ? {} : (stryCov_9fa48("1502"), {
      itemCodigo: stryMutAct_9fa48("1503") ? "" : (stryCov_9fa48("1503"), 'MOCK001'),
      estabCodigo: stryMutAct_9fa48("1504") ? "" : (stryCov_9fa48("1504"), '01'),
      estabNome: stryMutAct_9fa48("1505") ? "" : (stryCov_9fa48("1505"), 'Estabelecimento Mock'),
      codObsoleto: 0
    })])
  });
  async connect(): Promise<void> {
    if (stryMutAct_9fa48("1506")) {
      {}
    } else {
      stryCov_9fa48("1506");
      console.log(stryMutAct_9fa48("1507") ? "" : (stryCov_9fa48("1507"), 'Mock connection iniciada'));
    }
  }
  async query(queryString: string): Promise<any> {
    if (stryMutAct_9fa48("1508")) {
      {}
    } else {
      stryCov_9fa48("1508");
      console.log(stryMutAct_9fa48("1509") ? "" : (stryCov_9fa48("1509"), 'Mock query executada:'), queryString);
      if (stryMutAct_9fa48("1511") ? false : stryMutAct_9fa48("1510") ? true : (stryCov_9fa48("1510", "1511"), queryString.includes(stryMutAct_9fa48("1512") ? "" : (stryCov_9fa48("1512"), 'pub.item')))) {
        if (stryMutAct_9fa48("1513")) {
          {}
        } else {
          stryCov_9fa48("1513");
          return stryMutAct_9fa48("1514") ? [] : (stryCov_9fa48("1514"), [this.mockData.item]);
        }
      }
      if (stryMutAct_9fa48("1516") ? false : stryMutAct_9fa48("1515") ? true : (stryCov_9fa48("1515", "1516"), queryString.includes(stryMutAct_9fa48("1517") ? "" : (stryCov_9fa48("1517"), 'item-uni-estab')))) {
        if (stryMutAct_9fa48("1518")) {
          {}
        } else {
          stryCov_9fa48("1518");
          return this.mockData.estabelecimentos;
        }
      }
      return stryMutAct_9fa48("1519") ? ["Stryker was here"] : (stryCov_9fa48("1519"), []);
    }
  }
  async queryWithParams(queryString: string, params: QueryParameter[]): Promise<any> {
    if (stryMutAct_9fa48("1520")) {
      {}
    } else {
      stryCov_9fa48("1520");
      console.log(stryMutAct_9fa48("1521") ? "" : (stryCov_9fa48("1521"), 'Mock query parametrizada:'), queryString, params);
      if (stryMutAct_9fa48("1523") ? false : stryMutAct_9fa48("1522") ? true : (stryCov_9fa48("1522", "1523"), queryString.includes(stryMutAct_9fa48("1524") ? "" : (stryCov_9fa48("1524"), 'pub.item')))) {
        if (stryMutAct_9fa48("1525")) {
          {}
        } else {
          stryCov_9fa48("1525");
          return stryMutAct_9fa48("1526") ? [] : (stryCov_9fa48("1526"), [this.mockData.item]);
        }
      }
      if (stryMutAct_9fa48("1528") ? false : stryMutAct_9fa48("1527") ? true : (stryCov_9fa48("1527", "1528"), queryString.includes(stryMutAct_9fa48("1529") ? "" : (stryCov_9fa48("1529"), 'item-uni-estab')))) {
        if (stryMutAct_9fa48("1530")) {
          {}
        } else {
          stryCov_9fa48("1530");
          return this.mockData.estabelecimentos;
        }
      }
      return stryMutAct_9fa48("1531") ? ["Stryker was here"] : (stryCov_9fa48("1531"), []);
    }
  }
  async close(): Promise<void> {
    if (stryMutAct_9fa48("1532")) {
      {}
    } else {
      stryCov_9fa48("1532");
      console.log(stryMutAct_9fa48("1533") ? "" : (stryCov_9fa48("1533"), 'Mock connection fechada'));
    }
  }
  isConnected(): boolean {
    if (stryMutAct_9fa48("1534")) {
      {}
    } else {
      stryCov_9fa48("1534");
      return stryMutAct_9fa48("1535") ? false : (stryCov_9fa48("1535"), true);
    }
  }
}