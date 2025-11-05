// @ts-nocheck
// src/item/dadosCadastrais/informacoesGerais/service.ts

import { ItemInformacoesGeraisRepository } from './repository';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import { log } from '@shared/utils/logger';
import type { ItemInformacoesGerais } from './types';

export class InformacoesGeraisService {
  static async getInformacoesGerais(itemCodigo: string): Promise<ItemInformacoesGerais | null> {
    return withErrorHandling(
      async () => {
        const dados = await ItemInformacoesGeraisRepository.getItemCompleto(itemCodigo);

        validateEntityExists(
          dados.item,
          ItemNotFoundError,
          'itemCodigo',
          itemCodigo,
          'Item',
          'M' // ← adicionar gênero masculino
        );
        log.debug('=== DADOS.ITEM ===', { itemCodigo: dados.item.itemCodigo });

        return {
          item: {
            codigo: dados.item.itemCodigo,
            descricao: dados.item.itemDescricao,
            unidade: dados.item.itemUnidade,
            unidadeDescricao: dados.item.itemUnidadeDescricao,
            status: dados.item.status,
            deposito: dados.item.deposito,
            codLocalizacao: dados.item.codLocalizacao,
            estabelecimentoPadraoCodigo: dados.item.estabelecimentoPadraoCodigo,
            dataImplantacao: dados.item.dataImplantacao,
            dataLiberacao: dados.item.dataLiberacao,
            dataObsolescencia: dados.item.dataObsolescencia,
            itemNarrativa: dados.item.narrativa?.trim() || undefined,
            endereco: dados.item.endereco?.trim() || undefined,
            descricaoResumida: dados.item.descricaoResumida?.trim() || undefined,
            descricaoAlternativa: dados.item.descricaoAlternativa?.trim() || undefined,
            contenedor:
              dados.item.contenedorCodigo || dados.item.contenedorDescricao
                ? {
                    codigo: dados.item.contenedorCodigo?.trim() || undefined,
                    descricao: dados.item.contenedorDescricao?.trim() || undefined,
                  }
                : undefined,
            transporteEmbalagem:
              dados.item.teCodigo || dados.item.teDescricao
                ? {
                    codigo: dados.item.teCodigo?.trim() || undefined,
                    descricao: dados.item.teDescricao?.trim() || undefined,
                  }
                : undefined,
            vendaEmbalagem:
              dados.item.vendaEmbCodigo || dados.item.vendaEmbDescricao || dados.item.vendaEmbItens
                ? {
                    codigo: dados.item.vendaEmbCodigo?.trim() || undefined,
                    descricao: dados.item.vendaEmbDescricao?.trim() || undefined,
                    quantidade: dados.item.vendaEmbItens || undefined,
                  }
                : undefined,
            // Retorna APENAS códigos (flattened structure)
            familiaCodigo: dados.item.familiaCodigo?.trim() || null,
            familiaComercialCodigo: dados.item.familiaComercialCodigo?.trim() || null,
            grupoDeEstoqueCodigo: dados.item.grupoDeEstoqueCodigo?.trim() || null,
          },
          // Estabelecimentos como array de códigos apenas
          estabelecimentosCodigos: dados.estabelecimentos.map((estab) => estab.codigo),
        };
      },
      {
        entityName: 'item',
        codeFieldName: 'itemCodigo',
        codeValue: itemCodigo,
        operationName: 'buscar informações gerais',
      },
      ItemNotFoundError
    );
  }
}
