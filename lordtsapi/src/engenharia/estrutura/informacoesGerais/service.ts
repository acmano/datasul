import { EstruturaInformacoesGeraisRepository } from './repository';
import { validateConsultaParams } from './validators';
import { ItemNotFoundError, BusinessRuleError } from '@shared/errors/errors';
import { log } from '@shared/utils/logger';
import type { EstruturaCompleta, ItemEstrutura, ItemEstruturaFlat } from './types';

/**
 * Service - Estrutura de Produtos (BOM) e Processos de Fabricação
 *
 * Implementa a lógica de negócio para consulta de estruturas de produtos.
 * Esta camada é responsável por:
 * - Validar parâmetros de entrada
 * - Orquestrar chamadas ao repository
 * - Transformar e enriquecer dados
 * - Tratamento de erros de negócio
 */
export class EstruturaInformacoesGeraisService {
  /**
   * Obtém a estrutura completa de um produto (BOM) com processos de fabricação
   *
   * @param itemCodigo - Código do item principal
   * @param dataReferencia - Data de referência opcional (formato YYYY-MM-DD)
   * @returns Estrutura completa do produto
   * @throws {ValidationError} Se os parâmetros forem inválidos
   * @throws {ItemNotFoundError} Se o item não for encontrado
   * @throws {DatabaseError} Se houver erro na consulta
   */
  static async getEstrutura(
    itemCodigo: string,
    dataReferencia?: string
  ): Promise<EstruturaCompleta> {
    // 🔍 PERFORMANCE TRACKING: Start timer
    const startTime = Date.now();

    // 1. Validar parâmetros
    validateConsultaParams(itemCodigo, dataReferencia);

    log.info('Consultando estrutura de produto', {
      itemCodigo,
      dataReferencia: dataReferencia || 'hoje',
    });

    // 2. Buscar dados no repository
    const estrutura = await EstruturaInformacoesGeraisRepository.getEstruturaCompleta(
      itemCodigo,
      dataReferencia
    );

    // 3. Validar se encontrou resultado
    if (!estrutura) {
      log.warn('Item não encontrado ou sem estrutura', {
        itemCodigo,
        dataReferencia,
      });

      throw new ItemNotFoundError(itemCodigo);
    }

    // 4. Validar estrutura básica do resultado
    if (!estrutura.itemPrincipal) {
      log.error('Estrutura retornada sem item principal', {
        itemCodigo,
        estrutura,
      });

      throw new ItemNotFoundError(itemCodigo);
    }

    // 5. Validar profundidade máxima (prevenir loops infinitos e timeouts)
    const MAX_DEPTH = 20;
    if (estrutura.metadata?.totalNiveis && estrutura.metadata.totalNiveis > MAX_DEPTH) {
      log.error('Estrutura excede profundidade máxima permitida', {
        itemCodigo,
        totalNiveis: estrutura.metadata.totalNiveis,
        maxDepth: MAX_DEPTH,
      });

      throw new BusinessRuleError(
        `A estrutura do item ${itemCodigo} possui ${estrutura.metadata.totalNiveis} níveis, ` +
          `excedendo o limite máximo de ${MAX_DEPTH} níveis. ` +
          `Isso pode indicar uma referência circular ou estrutura inválida.`,
        'max_depth_exceeded'
      );
    }

    // 🔍 PERFORMANCE TRACKING: Calculate metrics
    const endTime = Date.now();
    const duration = endTime - startTime;
    const totalItens = estrutura.metadata?.totalItens || 1;
    const avgTimePerItem = totalItens > 0 ? duration / totalItens : duration;

    // 6. Log de sucesso com métricas de performance
    log.info('Estrutura carregada com sucesso', {
      itemCodigo,
      dataReferencia: dataReferencia || 'hoje',
      metrics: {
        totalNiveis: estrutura.metadata?.totalNiveis,
        totalItens: estrutura.metadata?.totalItens,
        totalOperacoes: estrutura.metadata?.totalOperacoes,
        totalHoras: estrutura.resumoHoras?.totais?.totalGeralHoras,
        centrosCusto: estrutura.resumoHoras?.porCentroCusto?.length || 0,
      },
      performance: {
        duration: `${duration}ms`,
        avgTimePerItem: `${avgTimePerItem.toFixed(2)}ms`,
        itemsPerSecond: totalItens > 0 ? Math.round((totalItens / duration) * 1000) : 0,
      },
    });

    return estrutura;
  }

  /**
   * Verifica se a funcionalidade de estrutura está disponível
   * (verifica se a stored procedure existe)
   *
   * @returns true se a funcionalidade está disponível
   */
  static async isAvailable(): Promise<boolean> {
    try {
      return await EstruturaInformacoesGeraisRepository.checkStoredProcedureExists();
    } catch (error) {
      log.error('Erro ao verificar disponibilidade do serviço de estrutura', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Obtém estatísticas resumidas da estrutura sem buscar todos os detalhes
   * (útil para dashboards e listagens)
   *
   * @param itemCodigo - Código do item
   * @param dataReferencia - Data de referência opcional
   * @returns Apenas metadata e resumo de horas
   */
  static async getResumo(
    itemCodigo: string,
    dataReferencia?: string
  ): Promise<Pick<EstruturaCompleta, 'metadata' | 'resumoHoras'>> {
    const estrutura = await this.getEstrutura(itemCodigo, dataReferencia);

    return {
      metadata: estrutura.metadata,
      resumoHoras: estrutura.resumoHoras,
    };
  }

  /**
   * Converte a estrutura hierárquica (tree) em formato plano (flat)
   *
   * Útil para:
   * - Exportação para CSV/Excel
   * - Tabelas sem hierarquia
   * - Processamento mais simples no frontend
   *
   * @param estrutura - Estrutura completa no formato tree
   * @returns Array plano com todos os itens incluindo nível e caminho
   */
  static flattenEstrutura(estrutura: EstruturaCompleta): ItemEstruturaFlat[] {
    const flat: ItemEstruturaFlat[] = [];

    const flatten = (item: ItemEstrutura, nivel: number, path: string[]) => {
      // Adicionar item atual ao array plano
      flat.push({
        ...item,
        nivel,
        path: [...path, item.codigo].join(' > '),
        parentPath: path.join(' > ') || null,
      });

      // Recursivamente processar filhos (componentes)
      if (item.componentes && item.componentes.length > 0) {
        for (const child of item.componentes) {
          flatten(child, nivel + 1, [...path, item.codigo]);
        }
      }
    };

    // Iniciar flatten a partir do item principal
    if (estrutura.itemPrincipal) {
      flatten(estrutura.itemPrincipal, 0, []);
    }

    return flat;
  }
}
