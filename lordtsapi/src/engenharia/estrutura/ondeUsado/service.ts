import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';
import { log } from '@shared/utils/logger';
import { OndeUsadoRepository } from './repository';
import { ItemNotFoundError, ValidationError } from '@shared/errors/errors';
import type { OndeUsadoCompleto } from './types';

/**
 * Service - Onde Usado (Where Used)
 * Camada de negócio para consulta de onde um componente é usado
 */
export class OndeUsadoService {
  /**
   * TTL padrão do cache: 5 minutos (300s)
   * Onde Usado tende a mudar menos que estruturas
   */
  private static readonly CACHE_TTL = 300;

  /**
   * Busca onde um componente é usado
   *
   * @param itemCodigo - Código do componente
   * @param dataReferencia - Data de referência opcional (formato YYYY-MM-DD)
   * @param apenasFinais - Se true, retorna apenas lista simples dos leafs com tipo=FINAL
   * @returns Estrutura de onde usado em formato hierárquico ou lista de finais
   * @throws ValidationError se itemCodigo estiver vazio
   * @throws ItemNotFoundError se item não existir
   */
  static async getOndeUsado(
    itemCodigo: string,
    dataReferencia?: string,
    apenasFinais = false
  ): Promise<OndeUsadoCompleto> {
    // Validação
    if (!itemCodigo || itemCodigo.trim() === '') {
      throw new ValidationError('Código do item é obrigatório', {
        field: 'itemCodigo',
        value: itemCodigo,
      });
    }

    // Validar formato da data se fornecida
    if (dataReferencia) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dataReferencia)) {
        throw new ValidationError('Data de referência deve estar no formato YYYY-MM-DD', {
          field: 'dataReferencia',
          value: dataReferencia,
          expected: 'YYYY-MM-DD',
        });
      }
    }

    const itemCodigoNormalized = itemCodigo.trim();

    log.info('Consultando onde usado do item', {
      itemCodigo: itemCodigoNormalized,
      dataReferencia,
      apenasFinais,
    });

    // Gerar chave de cache (incluir apenasFinais na chave)
    const cacheKey = generateCacheKey(
      'ondeUsado',
      itemCodigoNormalized,
      dataReferencia || 'current',
      apenasFinais ? 'finais' : 'completo'
    );

    try {
      // Buscar do cache ou executar repository
      const result = await CacheManager.getOrSet(
        cacheKey,
        async () => {
          log.debug('Cache miss - Buscando onde usado do banco', {
            itemCodigo: itemCodigoNormalized,
            dataReferencia,
            apenasFinais,
          });

          return await OndeUsadoRepository.getOndeUsado(
            itemCodigoNormalized,
            dataReferencia,
            apenasFinais
          );
        },
        this.CACHE_TTL
      );

      // Verificar se item foi encontrado
      if (!result) {
        log.warn('Item não encontrado para onde usado', {
          itemCodigo: itemCodigoNormalized,
          dataReferencia,
        });

        throw new ItemNotFoundError(itemCodigoNormalized);
      }

      log.info('Onde usado retornado com sucesso', {
        itemCodigo: itemCodigoNormalized,
        totalNiveis: result.metadata?.totalNiveis,
        totalItens: result.metadata?.totalItens,
      });

      return result;
    } catch (error) {
      log.error('Erro ao buscar onde usado', {
        itemCodigo: itemCodigoNormalized,
        dataReferencia,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Invalida o cache de onde usado de um item específico
   *
   * @param itemCodigo - Código do item
   */
  static async invalidarCache(itemCodigo: string): Promise<void> {
    const pattern = `ondeUsado:${itemCodigo}:*`;
    const count = await CacheManager.invalidate(pattern);

    log.info('Cache de onde usado invalidado', {
      itemCodigo,
      pattern,
      keysRemoved: count,
    });
  }

  /**
   * Invalida TODO o cache de onde usado
   */
  static async invalidarTodoCache(): Promise<void> {
    const pattern = 'ondeUsado:*';
    const count = await CacheManager.invalidate(pattern);

    log.info('Todo cache de onde usado invalidado', {
      pattern,
      keysRemoved: count,
    });
  }
}
