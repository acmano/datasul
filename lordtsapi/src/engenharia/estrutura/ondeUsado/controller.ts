import { Request, Response } from 'express';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { OndeUsadoService } from './service';
import { log } from '@shared/utils/logger';

/**
 * Controller - Onde Usado (Where Used)
 * Endpoints HTTP para consulta de onde um componente é usado
 */
export class OndeUsadoController {
  /**
   * GET /api/engenharia/estrutura/ondeUsado/:itemCodigo
   *
   * Retorna onde um componente é usado (estrutura inversa)
   *
   * Path params:
   * - itemCodigo: Código do componente
   *
   * Query params (opcionais):
   * - dataReferencia: Data de referência no formato YYYY-MM-DD
   * - apenasFinais: Se true, retorna apenas lista simples dos leafs com tipo=FINAL
   *
   * Exemplo: GET /api/engenharia/estrutura/ondeUsado/310064?dataReferencia=2025-01-15&apenasFinais=true
   */
  static getOndeUsado = asyncHandler(async (req: Request, res: Response) => {
    const itemCodigo: string = req.params.itemCodigo!;
    const dataReferencia: string = ((req.query.dataReferencia as string | undefined) ||
      new Date().toISOString().split('T')[0]) as string;
    const apenasFinais = req.query.apenasFinais === 'true';

    log.info('Requisição de onde usado recebida', {
      correlationId: req.id,
      itemCodigo,
      dataReferencia,
      apenasFinais,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    const resultado = await OndeUsadoService.getOndeUsado(itemCodigo, dataReferencia, apenasFinais);

    res.json({
      success: true,
      data: resultado,
      correlationId: req.id,
    });
  });

  /**
   * DELETE /api/engenharia/estrutura/ondeUsado/cache/:itemCodigo
   *
   * Invalida o cache de onde usado de um item específico
   *
   * Path params:
   * - itemCodigo: Código do item
   */
  static invalidarCache = asyncHandler(async (req: Request, res: Response) => {
    const itemCodigo: string = req.params.itemCodigo!;

    log.info('Requisição de invalidação de cache de onde usado', {
      correlationId: req.id,
      itemCodigo,
      ip: req.ip,
    });

    await OndeUsadoService.invalidarCache(itemCodigo);

    res.json({
      success: true,
      message: `Cache de onde usado invalidado para o item ${itemCodigo}`,
      correlationId: req.id,
    });
  });

  /**
   * DELETE /api/engenharia/estrutura/ondeUsado/cache
   *
   * Invalida TODO o cache de onde usado
   */
  static invalidarTodoCache = asyncHandler(async (req: Request, res: Response) => {
    log.info('Requisição de invalidação total de cache de onde usado', {
      correlationId: req.id,
      ip: req.ip,
    });

    await OndeUsadoService.invalidarTodoCache();

    res.json({
      success: true,
      message: 'Todo cache de onde usado foi invalidado',
      correlationId: req.id,
    });
  });
}
