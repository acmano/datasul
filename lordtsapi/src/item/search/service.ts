// src/item/search/service.ts

import { ItemSearchRepository } from './repository';
import { ItemSearchParams, ItemSearchResponse } from './types';
import { DatabaseError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';

export class ItemSearchService {
  static async searchItems(params: ItemSearchParams): Promise<ItemSearchResponse> {
    try {
      log.info('Iniciando busca de itens', { params });

      const items = await ItemSearchRepository.searchItems(params);

      log.info('Busca concluída', { total: items.length });

      return {
        success: true,
        criteriosDeBusca: {
          codigo: params.codigo || '',
          descricao: params.descricao || '',
          familia: params.familia || '',
          familiaComercial: params.familiaComercial || '',
          grupoEstoque: params.grupoEstoque || '',
          gtin: params.gtin || '',
          tipoItem: params.tipoItem || [],
        },
        data: items,
        total: items.length,
      };
    } catch (error) {
      log.error('Erro ao buscar itens', {
        params,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      throw new DatabaseError('Falha ao buscar itens', error instanceof Error ? error : undefined);
    }
  }
}
