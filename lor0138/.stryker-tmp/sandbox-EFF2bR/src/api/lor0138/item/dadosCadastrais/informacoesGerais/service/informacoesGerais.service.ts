// @ts-nocheck
// src/api/lor0138/item/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts
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
import { ItemInformacoesGeraisRepository } from '../repository/informacoesGerais.repository';
import { DatabaseError, ItemNotFoundError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';
export class InformacoesGeraisService {
  static async getInformacoesGerais(itemCodigo: string): Promise<any | null> {
    if (stryMutAct_9fa48("187")) {
      {}
    } else {
      stryCov_9fa48("187");
      try {
        if (stryMutAct_9fa48("188")) {
          {}
        } else {
          stryCov_9fa48("188");
          // Buscar dados do item
          const itemData = await ItemInformacoesGeraisRepository.getItemMaster(itemCodigo);

          // Se não encontrou o item
          if (stryMutAct_9fa48("191") ? false : stryMutAct_9fa48("190") ? true : stryMutAct_9fa48("189") ? itemData : (stryCov_9fa48("189", "190", "191"), !itemData)) {
            if (stryMutAct_9fa48("192")) {
              {}
            } else {
              stryCov_9fa48("192");
              log.info(stryMutAct_9fa48("193") ? "" : (stryCov_9fa48("193"), 'Item não encontrado'), stryMutAct_9fa48("194") ? {} : (stryCov_9fa48("194"), {
                itemCodigo
              }));
              throw new ItemNotFoundError(itemCodigo);
            }
          }

          // Buscar estabelecimentos
          const estabelecimentos = await ItemInformacoesGeraisRepository.getItemEstabelecimentos(itemCodigo);

          // Montar resposta
          const response = stryMutAct_9fa48("195") ? {} : (stryCov_9fa48("195"), {
            identificacaoItemCodigo: itemData.itemCodigo,
            identificacaoItemDescricao: itemData.itemDescricao,
            identificacaoItemUnidade: itemData.itemUnidade,
            identificacaoItensEstabelecimentos: estabelecimentos.map(stryMutAct_9fa48("196") ? () => undefined : (stryCov_9fa48("196"), estab => stryMutAct_9fa48("197") ? {} : (stryCov_9fa48("197"), {
              itemCodigo: estab.itemCodigo,
              estabCodigo: estab.estabCodigo,
              estabNome: estab.estabNome,
              statusIndex: (stryMutAct_9fa48("200") ? estab.codObsoleto !== 0 : stryMutAct_9fa48("199") ? false : stryMutAct_9fa48("198") ? true : (stryCov_9fa48("198", "199", "200"), estab.codObsoleto === 0)) ? 1 : 2
            })))
          });
          return response;
        }
      } catch (error) {
        if (stryMutAct_9fa48("201")) {
          {}
        } else {
          stryCov_9fa48("201");
          // Se já é erro customizado, re-lança
          if (stryMutAct_9fa48("203") ? false : stryMutAct_9fa48("202") ? true : (stryCov_9fa48("202", "203"), error instanceof ItemNotFoundError)) {
            if (stryMutAct_9fa48("204")) {
              {}
            } else {
              stryCov_9fa48("204");
              throw error;
            }
          }

          // Se for erro de banco, converte para DatabaseError
          log.error(stryMutAct_9fa48("205") ? "" : (stryCov_9fa48("205"), 'Erro ao buscar informações gerais'), stryMutAct_9fa48("206") ? {} : (stryCov_9fa48("206"), {
            itemCodigo,
            error: error instanceof Error ? error.message : stryMutAct_9fa48("207") ? "" : (stryCov_9fa48("207"), 'Erro desconhecido')
          }));
          throw new DatabaseError(stryMutAct_9fa48("208") ? "" : (stryCov_9fa48("208"), 'Falha ao buscar informações do item'), error instanceof Error ? error : undefined);
        }
      }
    }
  }
}