// src/api/lor0138/item/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts

import { ItemInformacoesGeraisRepository } from '../repository/informacoesGerais.repository';
import {
  ItemInformacoesGerais,
  ItemInformacoesGeraisEstabelecimento,
  ItemInformacoesGeraisResponseDTO,
  ItemEstabQueryResult,
} from '../types/informacoesGerais.types';

/**
 * Service para lógica de negócio de Informações Gerais
 */
export class ItemInformacoesGeraisService {
  /**
   * Busca informações gerais do item
   */
  static async getItemInformacoesGerais(
    itemCodigo: string
  ): Promise<ItemInformacoesGeraisResponseDTO> {
    try {
      // Busca dados mestres
      const itemMaster = await ItemInformacoesGeraisRepository.getItemMaster(itemCodigo);

      if (!itemMaster) {
        return {
          success: false,
          error: 'Item não encontrado',
        };
      }

      // Busca estabelecimentos
      const estabelecimentos = await ItemInformacoesGeraisRepository.getItemEstabelecimentos(
        itemCodigo
      );

      // Transforma dados
      const itemInformacoesGerais: ItemInformacoesGerais = {
        identificacaoItemCodigo: itemMaster.itemCodigo,
        identificacaoItemDescricao: itemMaster.itemDescricao,
        identificacaoItemUnidade: itemMaster.itemUnidade,
        identificacaoItensEstabelecimentos: estabelecimentos.map((estab) =>
          this.mapEstabelecimento(estab)
        ),
      };

      return {
        success: true,
        data: itemInformacoesGerais,
      };
    } catch (error) {
      // Loga erro completo no servidor
      console.error('Erro no service de informações gerais:', error);
      
      // Retorna mensagem genérica ao usuário
      return {
        success: false,
        error: 'Erro ao buscar informações do item. Tente novamente.',
      };
    }
  }

  /**
   * Mapeia dados de estabelecimento do banco para o DTO
   */
  private static mapEstabelecimento(
    estab: ItemEstabQueryResult
  ): ItemInformacoesGeraisEstabelecimento {
    return {
      itemCodigo: estab.itemCodigo,
      estabCodigo: estab.estabCodigo,
      estabNome: estab.estabNome,
      statusIndex: estab.codObsoleto,
    };
  }
}