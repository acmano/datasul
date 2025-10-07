// src/api/lor0138/familia/dadosCadastrais/informacoesGerais/controller/informacoesGerais.controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from '../service/informacoesGerais.service';
import { ItemNotFoundError, ValidationError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

/**
 * =============================================================================
 * CONTROLLER - INFORMAÇÕES GERAIS DA FAMILIA
 * =============================================================================
 *
 * Responsável por gerenciar requisições HTTP para consulta de informações
 * gerais da família no sistema Datasul.
 *
 * @module InformacoesGeraisController
 * @category Controllers
 * @subcategory Familia/DadosCadastrais
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
 * - GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/:familiaCodigo
 *
 * =============================================================================
 */
export class InformacoesGeraisController {

  /**
   * ---------------------------------------------------------------------------
   * MÉTODO: getInformacoesGerais
   * ---------------------------------------------------------------------------
   *
   * Busca informações gerais de uma família do sistema Datasul.
   *
   * @description
   * Controller principal para consulta de informações gerais de famílias.
   * Realiza validação de entrada, delega ao Service e retorna resposta formatada.
   *
   * FLUXO DE EXECUÇÃO:
   * 1. Extrai familiaCodigo dos parâmetros da URL
   * 2. Valida familiaCodigo (obrigatoriedade e tamanho máximo)
   * 3. Delega busca ao InformacoesGeraisService
   * 4. Verifica se família foi encontrada
   * 5. Retorna resposta HTTP 200 com dados da família
   *
   * VALIDAÇÕES REALIZADAS:
   * - familiaCodigo não pode ser vazio ou apenas espaços
   * - familiaCodigo não pode exceder 16 caracteres
   *
   * ERROS LANÇADOS:
   * - ValidationError: Quando familiaCodigo é inválido
   * - ItemNotFoundError: Quando família não existe no banco
   * - DatabaseError: Quando ocorre erro no acesso ao banco (via Service)
   *
   * PONTOS CRÍTICOS:
   * - asyncHandler captura erros assíncronos automaticamente
   * - Não utiliza trim() no familiaCodigo (mantém valor original)
   * - Erros são propagados via next() para middleware de erro
   *
   * @async
   * @static
   * @method getInformacoesGerais
   *
   * @param {Request} req - Objeto de requisição Express
   * @param {string} req.params.familiaCodigo - Código da família a ser consultada
   *
   * @param {Response} res - Objeto de resposta Express
   *
   * @param {NextFunction} next - Função para próximo middleware
   *
   * @returns {Promise<void>} Retorna resposta HTTP JSON:
   * @returns {boolean} success - Indica sucesso da operação (sempre true)
   * @returns {Object} data - Dados da família encontrada
   * @returns {string} data.identificacaoFamiliaCodigo - Código da família
   * @returns {string} data.identificacaoFamiliaDescricao - Descrição da família
   * @returns {string} data.identificacaoFamiliaUnidade - Unidade de medida
   * @returns {Array<Object>} data.identificacaoFamiliaEstabelecimentos - Lista de estabelecimentos
   *
   * @throws {ValidationError} Quando familiaCodigo é inválido
   * @throws {ItemNotFoundError} Quando família não é encontrada
   * @throws {DatabaseError} Quando ocorre erro no banco de dados
   *
   * @example
   * // Requisição válida
   * GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/450000
   *
   * // Resposta de sucesso (200)
   * {
   *   "success": true,
   *   "data": {
   *     "identificacaoFamiliaCodigo": "450000",
   *     "identificacaoFamiliaDescricao": "FAMÍLIA A",
   *   }
   * }
   *
   * @example
   * // Erro de validação (400)
   * GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/
   *
   * // Resposta
   * {
   *   "error": "ValidationError",
   *   "message": "Código da família é obrigatório",
   *   "context": {
   *     "familiaCodigo": "Campo vazio ou ausente"
   *   }
   * }
   *
   * @example
   * // Família não encontrada (404)
   * GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/INVALID
   *
   * // Resposta
   * {
   *   "error": "FamiliaNotFoundError",
   *   "message": "Família INVALID não encontrada"
   * }
   *
   * @see {@link InformacoesGeraisService.getInformacoesGerais}
   * @see {@link asyncHandler}
   */
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Extrai código da família dos parâmetros da URL
      const { familiaCodigo } = req.params;

      // ---------------------------------------------------------------------------
      // VALIDAÇÃO 1: FamiliaCodigo Obrigatório
      // ---------------------------------------------------------------------------
      // Verifica se familiaCodigo existe e não é apenas espaços em branco
      // IMPORTANTE: trim() é usado apenas para validação, não altera o valor enviado ao Service
      if (!familiaCodigo || familiaCodigo.trim() === '') {
        throw new ValidationError('Código da família é obrigatório', {
          familiaCodigo: 'Campo vazio ou ausente'
        });
      }

      // ---------------------------------------------------------------------------
      // VALIDAÇÃO 2: Tamanho Máximo
      // ---------------------------------------------------------------------------
      // FamiliaCodigo não pode exceder 16 caracteres (limite do banco Datasul)
      if (familiaCodigo.length > 16) {
        throw new ValidationError('Código da família inválido', {
          familiaCodigo: 'Máximo de 16 caracteres'
        });
      }

      // ---------------------------------------------------------------------------
      // BUSCA DE DADOS
      // ---------------------------------------------------------------------------
      // Delega a busca ao Service, que consultará o banco de dados
      // Service pode lançar:
      // - FamiliaNotFoundError: se familia não existe
      // - DatabaseError: se houver erro de conexão/query
      const result = await InformacoesGeraisService.getInformacoesGerais(familiaCodigo);

      // ---------------------------------------------------------------------------
      // VERIFICAÇÃO DE RESULTADO
      // ---------------------------------------------------------------------------
      // Verifica se Service retornou dados (não deve ocorrer, pois Service já lança erro)
      // Mantido como camada extra de segurança
      if (!result) {
        throw new FamiliaNotFoundError(familiaCodigo);
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
      const { familiaCodigo } = req.params;

      // Validação simples
      if (!familiaCodigo || familiaCodigo.trim() === '') {
        throw new ValidationError('Código da família é obrigatório');
      }

      // Busca dados
      const result = await InformacoesGeraisService.getInformacoesGerais(familiaCodigo);

      // Verifica resultado
      if (!result) {
        throw new FamiliaNotFoundError(familiaCodigo);
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