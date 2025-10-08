// @ts-nocheck
// src/api/lor0138/item/dadosCadastrais/informacoesGerais/controller/informacoesGerais.controller.ts
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
import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from '../service/informacoesGerais.service';
import { ItemNotFoundError, ValidationError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
export class InformacoesGeraisController {
  /**
   * GET /api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo
   */
  static getInformacoesGerais = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (stryMutAct_9fa48("97")) {
      {}
    } else {
      stryCov_9fa48("97");
      const {
        itemCodigo
      } = req.params;

      // Validação
      if (stryMutAct_9fa48("100") ? !itemCodigo && itemCodigo.trim() === '' : stryMutAct_9fa48("99") ? false : stryMutAct_9fa48("98") ? true : (stryCov_9fa48("98", "99", "100"), (stryMutAct_9fa48("101") ? itemCodigo : (stryCov_9fa48("101"), !itemCodigo)) || (stryMutAct_9fa48("103") ? itemCodigo.trim() !== '' : stryMutAct_9fa48("102") ? false : (stryCov_9fa48("102", "103"), (stryMutAct_9fa48("104") ? itemCodigo : (stryCov_9fa48("104"), itemCodigo.trim())) === (stryMutAct_9fa48("105") ? "Stryker was here!" : (stryCov_9fa48("105"), '')))))) {
        if (stryMutAct_9fa48("106")) {
          {}
        } else {
          stryCov_9fa48("106");
          throw new ValidationError(stryMutAct_9fa48("107") ? "" : (stryCov_9fa48("107"), 'Código do item é obrigatório'), stryMutAct_9fa48("108") ? {} : (stryCov_9fa48("108"), {
            itemCodigo: stryMutAct_9fa48("109") ? "" : (stryCov_9fa48("109"), 'Campo vazio ou ausente')
          }));
        }
      }
      if (stryMutAct_9fa48("113") ? itemCodigo.length <= 16 : stryMutAct_9fa48("112") ? itemCodigo.length >= 16 : stryMutAct_9fa48("111") ? false : stryMutAct_9fa48("110") ? true : (stryCov_9fa48("110", "111", "112", "113"), itemCodigo.length > 16)) {
        if (stryMutAct_9fa48("114")) {
          {}
        } else {
          stryCov_9fa48("114");
          throw new ValidationError(stryMutAct_9fa48("115") ? "" : (stryCov_9fa48("115"), 'Código do item inválido'), stryMutAct_9fa48("116") ? {} : (stryCov_9fa48("116"), {
            itemCodigo: stryMutAct_9fa48("117") ? "" : (stryCov_9fa48("117"), 'Máximo de 16 caracteres')
          }));
        }
      }

      // Buscar dados
      const result = await InformacoesGeraisService.getInformacoesGerais(itemCodigo);

      // Se não encontrou, lançar erro específico
      if (stryMutAct_9fa48("120") ? false : stryMutAct_9fa48("119") ? true : stryMutAct_9fa48("118") ? result : (stryCov_9fa48("118", "119", "120"), !result)) {
        if (stryMutAct_9fa48("121")) {
          {}
        } else {
          stryCov_9fa48("121");
          throw new ItemNotFoundError(itemCodigo);
        }
      }

      // Sucesso
      res.json(stryMutAct_9fa48("122") ? {} : (stryCov_9fa48("122"), {
        success: stryMutAct_9fa48("123") ? false : (stryCov_9fa48("123"), true),
        data: result
      }));
    }
  });
}

// Exemplo de controller SEM asyncHandler (forma antiga)
export class InformacoesGeraisControllerOld {
  static async getInformacoesGerais(req: Request, res: Response, next: NextFunction) {
    if (stryMutAct_9fa48("124")) {
      {}
    } else {
      stryCov_9fa48("124");
      try {
        if (stryMutAct_9fa48("125")) {
          {}
        } else {
          stryCov_9fa48("125");
          const {
            itemCodigo
          } = req.params;
          if (stryMutAct_9fa48("128") ? !itemCodigo && itemCodigo.trim() === '' : stryMutAct_9fa48("127") ? false : stryMutAct_9fa48("126") ? true : (stryCov_9fa48("126", "127", "128"), (stryMutAct_9fa48("129") ? itemCodigo : (stryCov_9fa48("129"), !itemCodigo)) || (stryMutAct_9fa48("131") ? itemCodigo.trim() !== '' : stryMutAct_9fa48("130") ? false : (stryCov_9fa48("130", "131"), (stryMutAct_9fa48("132") ? itemCodigo : (stryCov_9fa48("132"), itemCodigo.trim())) === (stryMutAct_9fa48("133") ? "Stryker was here!" : (stryCov_9fa48("133"), '')))))) {
            if (stryMutAct_9fa48("134")) {
              {}
            } else {
              stryCov_9fa48("134");
              throw new ValidationError(stryMutAct_9fa48("135") ? "" : (stryCov_9fa48("135"), 'Código do item é obrigatório'));
            }
          }
          const result = await InformacoesGeraisService.getInformacoesGerais(itemCodigo);
          if (stryMutAct_9fa48("138") ? false : stryMutAct_9fa48("137") ? true : stryMutAct_9fa48("136") ? result : (stryCov_9fa48("136", "137", "138"), !result)) {
            if (stryMutAct_9fa48("139")) {
              {}
            } else {
              stryCov_9fa48("139");
              throw new ItemNotFoundError(itemCodigo);
            }
          }
          res.json(stryMutAct_9fa48("140") ? {} : (stryCov_9fa48("140"), {
            success: stryMutAct_9fa48("141") ? false : (stryCov_9fa48("141"), true),
            data: result
          }));
        }
      } catch (error) {
        if (stryMutAct_9fa48("142")) {
          {}
        } else {
          stryCov_9fa48("142");
          next(error); // Importante: passar erro para o middleware
        }
      }
    }
  }
}