import { Request, Response } from 'express';
import { EstruturaInformacoesGeraisService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { log } from '@shared/utils/logger';
import type { EstruturaFlat, EstruturaTree } from './types';

/**
 * Controller - Estrutura de Produtos (BOM) e Processos de Fabricação
 *
 * Responsável por:
 * - Receber requisições HTTP
 * - Extrair e validar parâmetros
 * - Chamar service
 * - Formatar e retornar resposta
 */
export class EstruturaInformacoesGeraisController {
  /**
   * GET /api/engenharia/estrutura/informacoesGerais/:itemCodigo
   *
   * Retorna a estrutura completa de um produto (BOM) com processos de fabricação
   *
   * Parâmetros:
   * - itemCodigo (path): Código do item (obrigatório)
   * - dataReferencia (query): Data de referência no formato YYYY-MM-DD (opcional)
   * - format (query): Formato da resposta - 'tree' (padrão) ou 'flat' (opcional)
   *
   * Exemplos:
   * - GET /api/engenharia/estrutura/informacoesGerais/7530110
   * - GET /api/engenharia/estrutura/informacoesGerais/7530110?dataReferencia=2025-01-15
   * - GET /api/engenharia/estrutura/informacoesGerais/7530110?format=flat
   */
  static getEstrutura = asyncHandler(async (req: Request, res: Response) => {
    const itemCodigo: string = req.params.itemCodigo!;
    const dataReferencia: string = ((req.query.dataReferencia as string | undefined) ||
      new Date().toISOString().split('T')[0]) as string;
    const format = ((req.query.format as string) || 'tree').toLowerCase();

    // Validar formato
    if (format !== 'tree' && format !== 'flat') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Formato inválido. Use "tree" ou "flat"',
          code: 'invalid_format',
          details: { format },
        },
        correlationId: req.id,
      });
      return;
    }

    log.debug('Controller: requisição de estrutura recebida', {
      correlationId: req.id,
      itemCodigo,
      dataReferencia,
      format,
      ip: req.ip,
    });

    // Service já faz todas as validações
    const estrutura = await EstruturaInformacoesGeraisService.getEstrutura(
      itemCodigo,
      dataReferencia
    );

    // Transformar para formato plano se solicitado
    let data: EstruturaFlat | EstruturaTree;
    if (format === 'flat') {
      const flatItems = EstruturaInformacoesGeraisService.flattenEstrutura(estrutura);
      data = {
        metadata: estrutura.metadata,
        resumoHoras: estrutura.resumoHoras,
        items: flatItems,
        format: 'flat',
      };
    } else {
      data = {
        ...estrutura,
        format: 'tree',
      };
    }

    // Resposta de sucesso
    res.json({
      success: true,
      data,
      correlationId: req.id,
    });

    log.info('Estrutura retornada com sucesso', {
      correlationId: req.id,
      itemCodigo,
      format,
      totalItens: estrutura.metadata?.totalItens,
    });
  });

  /**
   * GET /api/engenharia/estrutura/informacoesGerais/:itemCodigo/resumo
   *
   * Retorna apenas o resumo da estrutura (metadata + resumo de horas)
   * Útil para dashboards e listagens que não precisam da árvore completa
   */
  static getResumo = asyncHandler(async (req: Request, res: Response) => {
    const itemCodigo: string = req.params.itemCodigo!;
    const dataReferencia: string = ((req.query.dataReferencia as string | undefined) ||
      new Date().toISOString().split('T')[0]) as string;

    log.debug('Controller: requisição de resumo recebida', {
      correlationId: req.id,
      itemCodigo,
      dataReferencia,
    });

    const resumo = await EstruturaInformacoesGeraisService.getResumo(itemCodigo, dataReferencia);

    res.json({
      success: true,
      data: resumo,
      correlationId: req.id,
    });

    log.info('Resumo retornado com sucesso', {
      correlationId: req.id,
      itemCodigo,
    });
  });

  /**
   * GET /api/engenharia/estrutura/health
   *
   * Verifica se a funcionalidade de estrutura está disponível
   * (verifica se a stored procedure existe)
   */
  static healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const isAvailable = await EstruturaInformacoesGeraisService.isAvailable();

    res.json({
      success: true,
      data: {
        available: isAvailable,
        message: isAvailable
          ? 'Serviço de estrutura disponível'
          : 'Stored procedure não encontrada',
      },
      correlationId: req.id,
    });
  });
}
