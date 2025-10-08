// @ts-nocheck
// src/api/lor0138/item/dadosCadastrais/informacoesGerais/routes/informacoesGerais.routes.ts
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
import { Router, Request, Response, NextFunction } from 'express';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { itemCache } from '@shared/middlewares/cachePresets';
const router = Router();

/**
 * @openapi
 * /api/lor0138/item/dadosCadastrais/informacoesGerais/{itemCodigo}:
 *   get:
 *     summary: Obter informações gerais de um item
 *     description: |
 *       Retorna dados cadastrais completos de um item do Datasul, incluindo:
 *       - Dados gerais (código, descrição, pesos)
 *       - Unidades de medida com fatores de conversão
 *       - Estabelecimentos onde o item está cadastrado
 *       
 *       **Importante**: Os dados são consultados via Linked Server (OPENQUERY) 
 *       do SQL Server para o Progress OpenEdge.
 *       
 *       **Rate Limit**: 10 requisições por minuto para o mesmo item
 *     tags:
 *       - Item - Informações Gerais
 *     parameters:
 *       - in: path
 *         name: itemCodigo
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z0-9]+$'
 *           minLength: 1
 *           maxLength: 16
 *         description: Código do item (alfanumérico, máx 16 caracteres)
 *         example: '7530110'
 *     responses:
 *       200:
 *         description: Informações do item retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InformacoesGerais'
 *             examples:
 *               sucesso:
 *                 summary: Item encontrado com múltiplos estabelecimentos
 *                 value:
 *                   dadosGerais:
 *                     codigo: '7530110'
 *                     descricao: 'VALVULA DE ESFERA 1/2" BRONZE'
 *                     unidadeMedida: 'UN'
 *                     pesoLiquido: 0.150
 *                     pesoBruto: 0.200
 *                   unidadesMedida:
 *                     - unidade: 'UN'
 *                       fatorConversao: 1.0
 *                       descricao: 'Unidade'
 *                     - unidade: 'CX'
 *                       fatorConversao: 12.0
 *                       descricao: 'Caixa com 12 unidades'
 *                   estabelecimentos:
 *                     - codigo: '01.01'
 *                       nome: 'CD São Paulo'
 *                       ativo: true
 *                       estoqueAtual: 1500.0
 *                       estoqueMinimo: 100.0
 *                       localEstoque: 'A-12-03'
 *                     - codigo: '02.01'
 *                       nome: 'Fábrica Joinville'
 *                       ativo: true
 *                       estoqueAtual: 3200.0
 *                       estoqueMinimo: 500.0
 *                       localEstoque: 'B-05-12'
 *               itemSemEstabelecimentos:
 *                 summary: Item sem estabelecimentos cadastrados
 *                 value:
 *                   dadosGerais:
 *                     codigo: '7530110'
 *                     descricao: 'VALVULA DE ESFERA 1/2" BRONZE'
 *                     unidadeMedida: 'UN'
 *                     pesoLiquido: 0.150
 *                     pesoBruto: 0.200
 *                   unidadesMedida:
 *                     - unidade: 'UN'
 *                       fatorConversao: 1.0
 *                       descricao: 'Unidade'
 *                   estabelecimentos: []
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *       504:
 *         description: Gateway Timeout - Requisição excedeu o tempo limite
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: 'Timeout da requisição'
 *               details: 'A consulta ao banco de dados demorou mais de 30 segundos'
 */
router.get(stryMutAct_9fa48("178") ? "" : (stryCov_9fa48("178"), '/:itemCodigo'), optionalApiKeyAuth,
// Autentica se tiver API Key
userRateLimit,
// Rate limit por usuário/tier
itemCache,
// Cache HTTP
async (req: Request, res: Response, next: NextFunction) => {
  if (stryMutAct_9fa48("179")) {
    {}
  } else {
    stryCov_9fa48("179");
    try {
      if (stryMutAct_9fa48("180")) {
        {}
      } else {
        stryCov_9fa48("180");
        // ✅ CORRIGIDO: Nome correto do controller
        const {
          InformacoesGeraisController
        } = await import(stryMutAct_9fa48("181") ? "" : (stryCov_9fa48("181"), '../controller/informacoesGerais.controller'));

        // ✅ CORRIGIDO: Passa req, res, next (3 parâmetros)
        await InformacoesGeraisController.getInformacoesGerais(req, res, next);
      }
    } catch (error) {
      if (stryMutAct_9fa48("182")) {
        {}
      } else {
        stryCov_9fa48("182");
        console.error(stryMutAct_9fa48("183") ? "" : (stryCov_9fa48("183"), 'Erro ao carregar controller:'), error);
        res.status(500).json(stryMutAct_9fa48("184") ? {} : (stryCov_9fa48("184"), {
          success: stryMutAct_9fa48("185") ? true : (stryCov_9fa48("185"), false),
          error: stryMutAct_9fa48("186") ? "" : (stryCov_9fa48("186"), 'Erro interno ao processar requisição')
        }));
      }
    }
  }
});
export default router;