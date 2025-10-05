// src/api/lor0138/item/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts

import { ItemInformacoesGeraisRepository } from '../repository/informacoesGerais.repository';
import { DatabaseError, ItemNotFoundError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';

export class InformacoesGeraisService {
  
  static async getInformacoesGerais(itemCodigo: string): Promise<any | null> {
    try {
      // Buscar dados do item
      const itemData = await ItemInformacoesGeraisRepository.getItemMaster(itemCodigo);
      
      // Se não encontrou o item
      if (!itemData) {
        log.info('Item não encontrado', { itemCodigo });
        throw new ItemNotFoundError(itemCodigo);
      }

      // Buscar estabelecimentos
      const estabelecimentos = await ItemInformacoesGeraisRepository.getItemEstabelecimentos(itemCodigo);

      // Montar resposta
      const response = {
        identificacaoItemCodigo: itemData.itemCodigo,
        identificacaoItemDescricao: itemData.itemDescricao,
        identificacaoItemUnidade: itemData.itemUnidade,
        identificacaoItensEstabelecimentos: estabelecimentos.map(estab => ({
          itemCodigo: estab.itemCodigo,
          estabCodigo: estab.estabCodigo,
          estabNome: estab.estabNome,
          statusIndex: estab.codObsoleto === 0 ? 1 : 2,
        })),
      };

      return response;
      
    } catch (error) {
      // Se já é erro customizado, re-lança
      if (error instanceof ItemNotFoundError) {
        throw error;
      }

      // Se for erro de banco, converte para DatabaseError
      log.error('Erro ao buscar informações gerais', {
        itemCodigo,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      throw new DatabaseError(
        'Falha ao buscar informações do item',
        error instanceof Error ? error : undefined
      );
    }
  }
}