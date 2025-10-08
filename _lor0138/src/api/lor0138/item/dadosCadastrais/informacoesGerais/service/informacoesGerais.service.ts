// src/api/lor0138/item/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts

import { ItemInformacoesGeraisRepository } from '../repository/informacoesGerais.repository';
import { DatabaseError, ItemNotFoundError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';

/**
 * Service - Informações Gerais do Item (estrutura aninhada)
 */
export class InformacoesGeraisService {
  
static async getInformacoesGerais(itemCodigo: string): Promise<any | null> {
  try {
    const dados = await ItemInformacoesGeraisRepository.getItemCompleto(itemCodigo);

    if (!dados.item) {
      log.info('Item não encontrado', { itemCodigo });
      throw new ItemNotFoundError(itemCodigo);
    }

    // 🔍 DEBUG
    console.log('🔍 DEBUG Service - dados.estabelecimentos:', JSON.stringify(dados.estabelecimentos, null, 2));

    const response = {
      item: {
        codigo: dados.item.itemCodigo,
        descricao: dados.item.itemDescricao,
        unidade: dados.item.itemUnidade
      },
      familia: dados.familia ? {
        codigo: dados.familia.familiaCodigo,
        descricao: dados.familia.familiaDescricao
      } : null,
      familiaComercial: dados.familiaComercial ? {
        codigo: dados.familiaComercial.familiaComercialCodigo,
        descricao: dados.familiaComercial.familiaComercialDescricao
      } : null,
      grupoDeEstoque: dados.grupoDeEstoque ? {
        codigo: dados.grupoDeEstoque.grupoCodigo,
        descricao: dados.grupoDeEstoque.grupoDescricao
      } : null,
      estabelecimentos: dados.estabelecimentos.map(estab => ({
        codigo: estab.codigo,
        nome: estab.nome
      }))
    };

    // 🔍 DEBUG
    console.log('🔍 DEBUG Service - response.estabelecimentos:', JSON.stringify(response.estabelecimentos, null, 2));

    return response;
  } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }

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