/**
 * Controller - Fiscal Base
 *
 * Controlador HTTP para endpoints de dados básicos de Fiscal
 *
 * Em desenvolvimento
 */

import { Request, Response, NextFunction } from 'express';
import { FiscalBaseService } from './service';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateItemCodigo } from '@shared/validators/paramValidators';
import { log } from '@shared/utils/logger';

/**
 * Controller para dados básicos de Fiscal
 *
 * Responsável por:
 * - Receber requisições HTTP
 * - Extrair e validar parâmetros
 * - Chamar service apropriado
 * - Formatar e retornar resposta
 *
 * TODO: Implementar endpoints específicos
 */
export class FiscalBaseController {
  /**
   * GET /api/fiscal/base/:codigo
   *
   * Busca dados básicos por código
   *
   * TODO: Implementar após definição de requisitos
   */
  static getBase = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const codigo = validateItemCodigo(req.params.codigo);

    log.debug('Controller: requisição de dados base Fiscal recebida', {
      correlationId: req.id,
      codigo,
      ip: req.ip,
    });

    const result = await FiscalBaseService.getBase(codigo);

    if (!result) {
      throw new ItemNotFoundError(codigo);
    }

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });

    log.info('Dados base Fiscal retornados com sucesso', {
      correlationId: req.id,
      codigo,
    });
  });

  /**
   * GET /api/fiscal/base
   *
   * Lista todos os registros base
   *
   * TODO: Implementar listagem com paginação e filtros
   */
  static listBase = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    log.debug('Controller: requisição de listagem Fiscal recebida', {
      correlationId: req.id,
      ip: req.ip,
    });

    const result = await FiscalBaseService.listBase();

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });

    log.info('Listagem Fiscal retornada com sucesso', {
      correlationId: req.id,
      total: result.length,
    });
  });
}
