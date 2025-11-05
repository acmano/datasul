/**
 * Controller - Suprimentos Base
 *
 * Controlador HTTP para endpoints de dados básicos de suprimentos
 *
 * Em desenvolvimento
 */

import { Request, Response, NextFunction } from 'express';
import { SuprimentosBaseService } from './service';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateItemCodigo } from '@shared/validators/paramValidators';
import { log } from '@shared/utils/logger';

/**
 * Controller para dados básicos de suprimentos
 *
 * Responsável por:
 * - Receber requisições HTTP
 * - Extrair e validar parâmetros
 * - Chamar service apropriado
 * - Formatar e retornar resposta
 *
 * TODO: Implementar endpoints específicos
 */
export class SuprimentosBaseController {
  /**
   * GET /api/suprimentos/base/:codigo
   *
   * Busca dados básicos por código
   *
   * TODO: Implementar após definição de requisitos
   */
  static getBase = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const codigo = validateItemCodigo(req.params.codigo);

    log.debug('Controller: requisição de dados base recebida', {
      correlationId: req.id,
      codigo,
      ip: req.ip,
    });

    const result = await SuprimentosBaseService.getBase(codigo);

    if (!result) {
      throw new ItemNotFoundError(codigo);
    }

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });

    log.info('Dados base retornados com sucesso', {
      correlationId: req.id,
      codigo,
    });
  });

  /**
   * GET /api/suprimentos/base
   *
   * Lista todos os registros base
   *
   * TODO: Implementar listagem com paginação e filtros
   */
  static listBase = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    log.debug('Controller: requisição de listagem recebida', {
      correlationId: req.id,
      ip: req.ip,
    });

    const result = await SuprimentosBaseService.listBase();

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });

    log.info('Listagem retornada com sucesso', {
      correlationId: req.id,
      total: result.length,
    });
  });
}
