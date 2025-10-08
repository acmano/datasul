// @ts-nocheck
// src/api/lor0138/item/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts
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
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

/**
 * Repository para consultas de Informações Gerais do Item
 */
export class ItemInformacoesGeraisRepository {
  /**
   * Busca dados mestres do item (COM CACHE - TTL: 10 minutos)
   */
  static async getItemMaster(itemCodigo: string): Promise<any | null> {
    if (stryMutAct_9fa48("143")) {
      {}
    } else {
      stryCov_9fa48("143");
      try {
        if (stryMutAct_9fa48("144")) {
          {}
        } else {
          stryCov_9fa48("144");
          const query = stryMutAct_9fa48("145") ? `` : (stryCov_9fa48("145"), `
        DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
        DECLARE @sql nvarchar(max);
        
        SET @sql = N'
          SELECT 
            item."it-codigo" as itemCodigo,
            item."desc-item" as itemDescricao,
            item."un" as itemUnidade
          FROM OPENQUERY(PRD_EMS2EMP, ''
            SELECT 
              item."it-codigo",
              item."desc-item", 
              item."un"
            FROM pub.item
            WHERE item."it-codigo" = ''''' + @itemCodigo + '''''
          '') as item
        ';
        
        EXEC sp_executesql @sql;
      `);
          const params: QueryParameter[] = stryMutAct_9fa48("146") ? [] : (stryCov_9fa48("146"), [stryMutAct_9fa48("147") ? {} : (stryCov_9fa48("147"), {
            name: stryMutAct_9fa48("148") ? "" : (stryCov_9fa48("148"), 'paramItemCodigo'),
            type: stryMutAct_9fa48("149") ? "" : (stryCov_9fa48("149"), 'varchar'),
            value: itemCodigo
          })]);

          // ✅ Query com cache L1/L2 (TTL: 10 minutos)
          const result = await QueryCacheService.withItemCache(query, params, stryMutAct_9fa48("150") ? () => undefined : (stryCov_9fa48("150"), async () => DatabaseManager.queryEmpWithParams(query, params)));
          return (stryMutAct_9fa48("153") ? result || result.length > 0 : stryMutAct_9fa48("152") ? false : stryMutAct_9fa48("151") ? true : (stryCov_9fa48("151", "152", "153"), result && (stryMutAct_9fa48("156") ? result.length <= 0 : stryMutAct_9fa48("155") ? result.length >= 0 : stryMutAct_9fa48("154") ? true : (stryCov_9fa48("154", "155", "156"), result.length > 0)))) ? result[0] : null;
        }
      } catch (error) {
        if (stryMutAct_9fa48("157")) {
          {}
        } else {
          stryCov_9fa48("157");
          console.error(stryMutAct_9fa48("158") ? "" : (stryCov_9fa48("158"), 'Erro ao buscar item master:'), error);
          throw error;
        }
      }
    }
  }

  /**
   * Busca estabelecimentos do item (COM CACHE - TTL: 15 minutos)
   */
  static async getItemEstabelecimentos(itemCodigo: string): Promise<any[]> {
    if (stryMutAct_9fa48("159")) {
      {}
    } else {
      stryCov_9fa48("159");
      try {
        if (stryMutAct_9fa48("160")) {
          {}
        } else {
          stryCov_9fa48("160");
          const query = stryMutAct_9fa48("161") ? `` : (stryCov_9fa48("161"), `
        DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
        DECLARE @sql nvarchar(max);
        
        SET @sql = N'
          SELECT 
            itemEstab."it-codigo" as itemCodigo,
            itemEstab."cod-estabel" as estabCodigo,
            estab."nome" as estabNome,
            itemEstab."cod-obsoleto" as codObsoleto
          FROM OPENQUERY(PRD_EMS2EMP, ''
            SELECT 
              "item-uni-estab"."it-codigo",
              "item-uni-estab"."cod-estabel",
              "item-uni-estab"."cod-obsoleto"
            FROM pub."item-uni-estab"
            WHERE "item-uni-estab"."it-codigo" = ''''' + @itemCodigo + '''''
          '') as itemEstab
          LEFT JOIN OPENQUERY(PRD_EMS2MULT, ''
            SELECT 
              estabelec."ep-codigo" as cod_estabel,
              estabelec."nome"
            FROM pub.estabelec
          '') as estab ON itemEstab."cod-estabel" = estab.cod_estabel
        ';
        
        EXEC sp_executesql @sql;
      `);
          const params: QueryParameter[] = stryMutAct_9fa48("162") ? [] : (stryCov_9fa48("162"), [stryMutAct_9fa48("163") ? {} : (stryCov_9fa48("163"), {
            name: stryMutAct_9fa48("164") ? "" : (stryCov_9fa48("164"), 'paramItemCodigo'),
            type: stryMutAct_9fa48("165") ? "" : (stryCov_9fa48("165"), 'varchar'),
            value: itemCodigo
          })]);

          // ✅ Query com cache L1/L2 (TTL: 15 minutos)
          const result = await QueryCacheService.withEstabelecimentoCache(query, params, stryMutAct_9fa48("166") ? () => undefined : (stryCov_9fa48("166"), async () => DatabaseManager.queryEmpWithParams(query, params)));
          return stryMutAct_9fa48("169") ? result && [] : stryMutAct_9fa48("168") ? false : stryMutAct_9fa48("167") ? true : (stryCov_9fa48("167", "168", "169"), result || (stryMutAct_9fa48("170") ? ["Stryker was here"] : (stryCov_9fa48("170"), [])));
        }
      } catch (error) {
        if (stryMutAct_9fa48("171")) {
          {}
        } else {
          stryCov_9fa48("171");
          console.error(stryMutAct_9fa48("172") ? "" : (stryCov_9fa48("172"), 'Erro ao buscar estabelecimentos:'), error);
          throw error;
        }
      }
    }
  }

  /**
   * Invalida cache do item (chamar após UPDATE/DELETE)
   */
  static async invalidateCache(itemCodigo: string): Promise<void> {
    if (stryMutAct_9fa48("173")) {
      {}
    } else {
      stryCov_9fa48("173");
      await QueryCacheService.invalidateMultiple(stryMutAct_9fa48("174") ? [] : (stryCov_9fa48("174"), [stryMutAct_9fa48("175") ? "" : (stryCov_9fa48("175"), 'item:*'), stryMutAct_9fa48("176") ? "" : (stryCov_9fa48("176"), 'estabelecimento:*')]));
      console.log(stryMutAct_9fa48("177") ? "" : (stryCov_9fa48("177"), 'Cache invalidado para item:'), itemCodigo);
    }
  }
}