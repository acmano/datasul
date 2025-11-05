/**
 * Controller - Suprimentos Programação de Entrega
 *
 * Controlador HTTP para endpoints de programação de entregas
 *
 * Em desenvolvimento
 */

import { Request, Response, NextFunction } from 'express';
import { ProgramacaoEntregaService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { log } from '@shared/utils/logger';

/**
 * Controller para programações de entrega
 *
 * Responsável por:
 * - Receber requisições HTTP
 * - Extrair e validar parâmetros
 * - Chamar service apropriado
 * - Formatar e retornar resposta
 *
 * TODO: Implementar endpoints específicos
 */
export class ProgramacaoEntregaController {
  /**
   * GET /api/suprimentos/programacaoEntrega
   *
   * Busca programações por filtros
   *
   * Query params:
   * - itemCodigo: Código do item (opcional)
   * - fornecedorCodigo: Código do fornecedor (opcional)
   * - dataInicio: Data início (YYYY-MM-DD) (opcional)
   * - dataFim: Data fim (YYYY-MM-DD) (opcional)
   * - status: Status da programação (opcional)
   */
  static getProgramacoes = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const filtros = {
        itemCodigo: req.query.itemCodigo as string | undefined,
        fornecedorCodigo: req.query.fornecedorCodigo as string | undefined,
        dataInicio: req.query.dataInicio as string | undefined,
        dataFim: req.query.dataFim as string | undefined,
        status: req.query.status as string | undefined,
      };

      log.debug('Controller: requisição de programações recebida', {
        correlationId: req.id,
        filtros,
        ip: req.ip,
      });

      const result = await ProgramacaoEntregaService.getProgramacoes(filtros);

      res.json({
        success: true,
        data: result,
        correlationId: req.id,
      });

      log.info('Programações retornadas com sucesso', {
        correlationId: req.id,
        total: result.length,
      });
    }
  );

  /**
   * GET /api/suprimentos/programacaoEntrega/:numero
   *
   * Busca detalhes de uma programação específica
   */
  static getDetalhes = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const numero = parseInt(req.params.numero, 10);

    if (isNaN(numero)) {
      res.status(400).json({
        success: false,
        error: 'Número de programação inválido',
        correlationId: req.id,
      });
      return;
    }

    log.debug('Controller: requisição de detalhes recebida', {
      correlationId: req.id,
      numero,
      ip: req.ip,
    });

    const result = await ProgramacaoEntregaService.getDetalhes(numero);

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });

    log.info('Detalhes da programação retornados com sucesso', {
      correlationId: req.id,
      numero,
    });
  });

  /**
   * GET /api/suprimentos/programacaoEntrega/resumo
   *
   * Busca resumo de programações por período
   */
  static getResumo = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const dataInicio = req.query.dataInicio as string | undefined;
    const dataFim = req.query.dataFim as string | undefined;

    log.debug('Controller: requisição de resumo recebida', {
      correlationId: req.id,
      dataInicio,
      dataFim,
      ip: req.ip,
    });

    const result = await ProgramacaoEntregaService.getResumo(dataInicio, dataFim);

    res.json({
      success: true,
      data: result,
      correlationId: req.id,
    });

    log.info('Resumo de programações retornado com sucesso', {
      correlationId: req.id,
    });
  });

  /**
   * GET /api/suprimentos/programacaoEntrega/porFornecedor
   *
   * Busca programações agrupadas por fornecedor
   */
  static getPorFornecedor = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const dataInicio = req.query.dataInicio as string | undefined;
      const dataFim = req.query.dataFim as string | undefined;

      log.debug('Controller: requisição de programações por fornecedor recebida', {
        correlationId: req.id,
        dataInicio,
        dataFim,
        ip: req.ip,
      });

      const result = await ProgramacaoEntregaService.getPorFornecedor(dataInicio, dataFim);

      res.json({
        success: true,
        data: result,
        correlationId: req.id,
      });

      log.info('Programações por fornecedor retornadas com sucesso', {
        correlationId: req.id,
        total: result.length,
      });
    }
  );
}
