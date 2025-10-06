// src/api/lor0138/item/dadosCadastrais/informacoesGerais/controller/informacoesGerais.controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from '../service/informacoesGerais.service';
import { ItemNotFoundError, ValidationError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

/**
 * =============================================================================
 * CONTROLLER - INFORMAÇÕES GERAIS DO ITEM
 * =============================================================================
 *
 * Responsável por gerenciar requisições HTTP para consulta de informações
 * gerais de itens do sistema Datasul.
 *
 * @module InformacoesGeraisController
 * @category Controllers
 * @subcategory Item/DadosCadastrais
 *
 * RESPONSABILIDADES:
 * - Validar parâmetros de entrada da requisição
 * - Delegar processamento para o Service
 * - Formatar resposta HTTP
 * - Tratar erros através do asyncHandler
 *
 * ARQUITETURA:
 * - Utiliza padrão asyncHandler para tratamento de erros assíncronos
 * - Valida entrada antes de chamar o Service
 * - Retorna erros padronizados (ValidationError, ItemNotFoundError)
 *
 * ENDPOINTS:
 * - GET /api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo
 *
 * =============================================================================
 */
export class InformacoesGeraisController {

  /**
   * ---------------------------------------------------------------------------
   * MÉTODO: getInformacoesGerais
   * ---------------------------------------------------------------------------
   *
   * Busca informações gerais de um item do sistema Datasul.
   *
   * @description
   * Controller principal para consulta de informações gerais de itens.
   * Realiza validação de entrada, delega ao Service e retorna resposta formatada.
   *
   * FLUXO DE EXECUÇÃO:
   * 1. Extrai itemCodigo dos parâmetros da URL
   * 2. Valida itemCodigo (obrigatoriedade e tamanho máximo)
   * 3. Delega busca ao InformacoesGeraisService
   * 4. Verifica se item foi encontrado
   * 5. Retorna resposta HTTP 200 com dados do item
   *
   * VALIDAÇÕES REALIZADAS:
   * - itemCodigo não pode ser vazio ou apenas espaços
   * - itemCodigo não pode exceder 16 caracteres
   *
   * ERROS LANÇADOS:
   * - ValidationError: Quando itemCodigo é inválido
   * - ItemNotFoundError: Quando item não existe no banco
   * - DatabaseError: Quando ocorre erro no acesso ao banco (via Service)
   *
   * PONTOS CRÍTICOS:
   * - asyncHandler captura erros assíncronos automaticamente
   * - Não utiliza trim() no itemCodigo (mantém valor original)
   * - Erros são propagados via next() para middleware de erro
   *
   * @async
   * @static
   * @method getInformacoesGerais
   *
   * @param {Request} req - Objeto de requisição Express
   * @param {string} req.params.itemCodigo - Código do item a ser consultado
   *
   * @param {Response} res - Objeto de resposta Express
   *
   * @param {NextFunction} next - Função para próximo middleware
   *
   * @returns {Promise<void>} Retorna resposta HTTP JSON:
   * @returns {boolean} success - Indica sucesso da operação (sempre true)
   * @returns {Object} data - Dados do item encontrado
   * @returns {string} data.identificacaoItemCodigo - Código do item
   * @returns {string} data.identificacaoItemDescricao - Descrição do item
   * @returns {string} data.identificacaoItemUnidade - Unidade de medida
   * @returns {Array<Object>} data.identificacaoItensEstabelecimentos - Lista de estabelecimentos
   *
   * @throws {ValidationError} Quando itemCodigo é inválido
   * @throws {ItemNotFoundError} Quando item não é encontrado
   * @throws {DatabaseError} Quando ocorre erro no banco de dados
   *
   * @example
   * // Requisição válida
   * GET /api/lor0138/item/dadosCadastrais/informacoesGerais/7530110
   *
   * // Resposta de sucesso (200)
   * {
   *   "success": true,
   *   "data": {
   *     "identificacaoItemCodigo": "7530110",
   *     "identificacaoItemDescricao": "VALVULA DE ESFERA 1/2\" BRONZE",
   *     "identificacaoItemUnidade": "UN",
   *     "identificacaoItensEstabelecimentos": [
   *       {
   *         "itemCodigo": "7530110",
   *         "estabCodigo": "01.01",
   *         "estabNome": "CD São Paulo",
   *         "statusIndex": 1
   *       }
   *     ]
   *   }
   * }
   *
   * @example
   * // Erro de validação (400)
   * GET /api/lor0138/item/dadosCadastrais/informacoesGerais/
   *
   * // Resposta
   * {
   *   "error": "ValidationError",
   *   "message": "Código do item é obrigatório",
   *   "context": {
   *     "itemCodigo": "Campo vazio ou ausente"
   *   }
   * }
   *
   * @example
   * // Item não encontrado (404)
   * GET /api/lor0138/item/dadosCadastrais/informacoesGerais/INVALID
   *
   * // Resposta
   * {
   *   "error": "ItemNotFoundError",
   *   "message": "Item INVALID não encontrado"
   * }
   *
   * @see {@link InformacoesGeraisService.getInformacoesGerais}
   * @see {@link asyncHandler}
   */
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Extrai código do item dos parâmetros da URL
      const { itemCodigo } = req.params;

      // ---------------------------------------------------------------------------
      // VALIDAÇÃO 1: ItemCodigo Obrigatório
      // ---------------------------------------------------------------------------
      // Verifica se itemCodigo existe e não é apenas espaços em branco
      // IMPORTANTE: trim() é usado apenas para validação, não altera o valor enviado ao Service
      if (!itemCodigo || itemCodigo.trim() === '') {
        throw new ValidationError('Código do item é obrigatório', {
          itemCodigo: 'Campo vazio ou ausente'
        });
      }

      // ---------------------------------------------------------------------------
      // VALIDAÇÃO 2: Tamanho Máximo
      // ---------------------------------------------------------------------------
      // ItemCodigo não pode exceder 16 caracteres (limite do banco Datasul)
      if (itemCodigo.length > 16) {
        throw new ValidationError('Código do item inválido', {
          itemCodigo: 'Máximo de 16 caracteres'
        });
      }

      // ---------------------------------------------------------------------------
      // BUSCA DE DADOS
      // ---------------------------------------------------------------------------
      // Delega a busca ao Service, que consultará o banco de dados
      // Service pode lançar:
      // - ItemNotFoundError: se item não existe
      // - DatabaseError: se houver erro de conexão/query
      const result = await InformacoesGeraisService.getInformacoesGerais(itemCodigo);

      // ---------------------------------------------------------------------------
      // VERIFICAÇÃO DE RESULTADO
      // ---------------------------------------------------------------------------
      // Verifica se Service retornou dados (não deve ocorrer, pois Service já lança erro)
      // Mantido como camada extra de segurança
      if (!result) {
        throw new ItemNotFoundError(itemCodigo);
      }

      // ---------------------------------------------------------------------------
      // RESPOSTA DE SUCESSO
      // ---------------------------------------------------------------------------
      // Retorna HTTP 200 com dados do item
      // Formato padronizado: { success: boolean, data: Object }
      res.json({
        success: true,
        data: result,
      });
    }
  );
}

// =============================================================================
// CLASSE DE EXEMPLO - IMPLEMENTAÇÃO ANTIGA (SEM ASYNCHANDLER)
// =============================================================================
/**
 * Exemplo de controller SEM asyncHandler (forma antiga).
 *
 * @deprecated Esta implementação é mantida apenas como referência educacional.
 *
 * @description
 * Demonstra a implementação anterior sem asyncHandler, onde o tratamento
 * de erros era feito manualmente com try/catch.
 *
 * DIFERENÇAS DA IMPLEMENTAÇÃO ATUAL:
 * - Requer try/catch manual
 * - Deve chamar next(error) explicitamente
 * - Mais verboso e propenso a erros
 *
 * RECOMENDAÇÃO:
 * Use sempre asyncHandler para controllers assíncronos.
 * Ele captura automaticamente erros assíncronos e os passa para next().
 *
 * @class InformacoesGeraisControllerOld
 * @example
 * // Uso antigo (não recomendado)
 * static async getInformacoesGerais(req, res, next) {
 *   try {
 *     // lógica aqui
 *   } catch (error) {
 *     next(error); // deve chamar next manualmente
 *   }
 * }
 *
 * // Uso atual (recomendado)
 * static getInformacoesGerais = asyncHandler(async (req, res, next) => {
 *   // lógica aqui
 *   // erros são capturados automaticamente
 * });
 */
export class InformacoesGeraisControllerOld {

  /**
   * Implementação antiga do método getInformacoesGerais.
   *
   * @deprecated Use InformacoesGeraisController.getInformacoesGerais com asyncHandler
   *
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @param {NextFunction} next - Função para próximo middleware
   *
   * @returns {Promise<void>}
   *
   * @example
   * // Esta forma requer try/catch manual
   * try {
   *   await controller(req, res, next);
   * } catch (error) {
   *   next(error); // Erro deve ser passado manualmente
   * }
   */
  static async getInformacoesGerais(req: Request, res: Response, next: NextFunction) {
    try {
      // Extrai parâmetro
      const { itemCodigo } = req.params;

      // Validação simples
      if (!itemCodigo || itemCodigo.trim() === '') {
        throw new ValidationError('Código do item é obrigatório');
      }

      // Busca dados
      const result = await InformacoesGeraisService.getInformacoesGerais(itemCodigo);

      // Verifica resultado
      if (!result) {
        throw new ItemNotFoundError(itemCodigo);
      }

      // Retorna resposta
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      // IMPORTANTE: Passar erro para o middleware de tratamento de erros
      // Sem isso, erros não serão tratados adequadamente
      next(error);
    }
  }
}