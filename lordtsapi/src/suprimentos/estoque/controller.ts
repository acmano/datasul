/**
 * Controller - Suprimentos Estoque
 *
 * Controlador HTTP para endpoints de estoque/inventário
 *
 * Em desenvolvimento
 */

import { Request, Response, NextFunction } from 'express';
import { EstoqueService } from './service';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateItemCodigo } from '@shared/validators/paramValidators';
import { log } from '@shared/utils/logger';

/**
 * Controller para dados de estoque
 *
 * Responsável por:
 * - Receber requisições HTTP
 * - Extrair e validar parâmetros
 * - Chamar service apropriado
 * - Formatar e retornar resposta
 *
 * TODO: Implementar endpoints específicos
 */
export class EstoqueController {
  /**
   * GET /api/suprimentos/estoque/:itemCodigo
   *
   * Busca dados de estoque por código do item
   *
   * TODO: Implementar após definição de requisitos
   */
  static getEstoque = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const itemCodigo = validateItemCodigo(req.params.itemCodigo);

    log.debug('Controller: requisição de estoque recebida', {
      correlationId: req.id,
      itemCodigo,
      ip: req.ip,
    });

    const result = await EstoqueService.getEstoque(itemCodigo);

    if (!result) {
      throw new ItemNotFoundError(itemCodigo);
    }

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });

    log.info('Dados de estoque retornados com sucesso', {
      correlationId: req.id,
      itemCodigo,
    });
  });

  /**
   * GET /api/suprimentos/estoque/:itemCodigo/saldo
   *
   * Busca saldos de estoque por item
   *
   * Query params:
   * - estabelecimento (opcional): filtra por estabelecimento
   */
  static getSaldo = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const itemCodigo = validateItemCodigo(req.params.itemCodigo);
    const estabelecimento = req.query.estabelecimento as string | undefined;

    log.debug('Controller: requisição de saldo de estoque recebida', {
      correlationId: req.id,
      itemCodigo,
      estabelecimento,
      ip: req.ip,
    });

    const result = await EstoqueService.getSaldo(itemCodigo, estabelecimento);

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });

    log.info('Saldos de estoque retornados com sucesso', {
      correlationId: req.id,
      itemCodigo,
      total: result.length,
    });
  });
}
