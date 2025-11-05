// src/item/itemEmpresas/service.ts

import { ItemEmpresasRepository } from './repository';
import { ItemEmpresasParams, ItemEmpresasResponse } from './types';
import { DatabaseError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';

export class ItemEmpresasService {
  static async getItemEmpresas(params: ItemEmpresasParams): Promise<ItemEmpresasResponse> {
    try {
      log.info('Iniciando busca de empresas do item', { params });

      const empresas = await ItemEmpresasRepository.getItemEmpresas(params);

      log.info('Busca concluída', { total: empresas.length });

      return {
        success: true,
        data: {
          codigo: params.codigo,
          empresas: empresas,
        },
        total: empresas.length,
      };
    } catch (error) {
      log.error('Erro ao buscar empresas do item', {
        params,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      throw new DatabaseError(
        'Falha ao buscar empresas do item',
        error instanceof Error ? error : undefined
      );
    }
  }
}
