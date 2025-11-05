/**
 * Controller - Suprimentos Fornecedores
 *
 * Controlador HTTP para endpoints de fornecedores
 *
 * Em desenvolvimento
 */

import { Request, Response, NextFunction } from 'express';
import { FornecedorService } from './service';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { log } from '@shared/utils/logger';

/**
 * Controller para dados de fornecedores
 *
 * Responsável por:
 * - Receber requisições HTTP
 * - Extrair e validar parâmetros
 * - Chamar service apropriado
 * - Formatar e retornar resposta
 *
 * TODO: Implementar endpoints específicos
 */
export class FornecedorController {
  /**
   * GET /api/suprimentos/fornecedores/:codigo
   *
   * Busca dados completos de um fornecedor
   */
  static getFornecedor = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const codigo = req.params.codigo;

    log.debug('Controller: requisição de fornecedor recebida', {
      correlationId: req.id,
      codigo,
      ip: req.ip,
    });

    const result = await FornecedorService.getFornecedor(codigo);

    if (!result) {
      throw new ItemNotFoundError(codigo);
    }

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });

    log.info('Dados de fornecedor retornados com sucesso', {
      correlationId: req.id,
      codigo,
    });
  });

  /**
   * GET /api/suprimentos/fornecedores
   *
   * Lista todos os fornecedores
   */
  static listFornecedores = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      log.debug('Controller: requisição de listagem de fornecedores recebida', {
        correlationId: req.id,
        ip: req.ip,
      });

      const result = await FornecedorService.listFornecedores();

      res.json({
        success: true,
        data: result,
        correlationId: req.id,
      });

      log.info('Listagem de fornecedores retornada com sucesso', {
        correlationId: req.id,
        total: result.length,
      });
    }
  );

  /**
   * GET /api/suprimentos/fornecedores/:codigo/itens
   *
   * Busca itens fornecidos por um fornecedor
   */
  static getItensFornecidos = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const codigo = req.params.codigo;

      log.debug('Controller: requisição de itens fornecidos recebida', {
        correlationId: req.id,
        codigo,
        ip: req.ip,
      });

      const result = await FornecedorService.getItensFornecidos(codigo);

      res.json({
        success: true,
        data: result,
        correlationId: req.id,
      });

      log.info('Itens fornecidos retornados com sucesso', {
        correlationId: req.id,
        codigo,
        total: result.length,
      });
    }
  );
}
