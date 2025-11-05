/**
 * Controller - Suprimentos Movimento
 *
 * Controlador HTTP para endpoints de movimentação de estoque
 *
 * Em desenvolvimento
 */

import { Request, Response, NextFunction } from 'express';
import { MovimentoService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateItemCodigo } from '@shared/validators/paramValidators';
import { log } from '@shared/utils/logger';

/**
 * Controller para movimentações de estoque
 *
 * Responsável por:
 * - Receber requisições HTTP
 * - Extrair e validar parâmetros
 * - Chamar service apropriado
 * - Formatar e retornar resposta
 *
 * TODO: Implementar endpoints específicos
 */
export class MovimentoController {
  /**
   * GET /api/suprimentos/movimento/:itemCodigo
   *
   * Busca movimentações por código do item
   *
   * Query params:
   * - dataInicio: Data de início (YYYY-MM-DD)
   * - dataFim: Data fim (YYYY-MM-DD)
   * - tipoMovimento: Tipo de movimento (entrada/saida/transferencia/ajuste)
   */
  static getMovimentacoes = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const itemCodigo = validateItemCodigo(req.params.itemCodigo);
      const dataInicio = req.query.dataInicio as string | undefined;
      const dataFim = req.query.dataFim as string | undefined;
      const tipoMovimento = req.query.tipoMovimento as string | undefined;

      log.debug('Controller: requisição de movimentações recebida', {
        correlationId: req.id,
        itemCodigo,
        dataInicio,
        dataFim,
        tipoMovimento,
        ip: req.ip,
      });

      const result = await MovimentoService.getMovimentacoes(
        itemCodigo,
        dataInicio,
        dataFim,
        tipoMovimento
      );

      res.json({
        success: true,
        data: result,
        correlationId: req.id,
      });

      log.info('Movimentações retornadas com sucesso', {
        correlationId: req.id,
        itemCodigo,
        total: result.length,
      });
    }
  );

  /**
   * GET /api/suprimentos/movimento/:itemCodigo/resumo
   *
   * Busca resumo de movimentações
   */
  static getResumo = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const itemCodigo = validateItemCodigo(req.params.itemCodigo);
    const dataInicio = req.query.dataInicio as string | undefined;
    const dataFim = req.query.dataFim as string | undefined;

    log.debug('Controller: requisição de resumo recebida', {
      correlationId: req.id,
      itemCodigo,
      dataInicio,
      dataFim,
      ip: req.ip,
    });

    const result = await MovimentoService.getResumo(itemCodigo, dataInicio, dataFim);

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });

    log.info('Resumo de movimentações retornado com sucesso', {
      correlationId: req.id,
      itemCodigo,
    });
  });

  /**
   * GET /api/suprimentos/movimento/detalhes/:numero
   *
   * Busca detalhes de uma movimentação específica
   */
  static getDetalhes = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const numero = parseInt(req.params.numero, 10);

    if (isNaN(numero)) {
      res.status(400).json({
        success: false,
        error: 'Número de movimentação inválido',
        correlationId: req.id,
      });
      return;
    }

    log.debug('Controller: requisição de detalhes recebida', {
      correlationId: req.id,
      numero,
      ip: req.ip,
    });

    const result = await MovimentoService.getDetalhes(numero);

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });

    log.info('Detalhes da movimentação retornados com sucesso', {
      correlationId: req.id,
      numero,
    });
  });
}
