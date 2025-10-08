// src/item/dadosCadastrais/informacoesGerais/service.ts

import { ItemInformacoesGeraisRepository } from './repository';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';

export class InformacoesGeraisService {
  static async getInformacoesGerais(itemCodigo: string): Promise<any | null> {
    return withErrorHandling(
      async () => {
        const dados = await ItemInformacoesGeraisRepository.getItemCompleto(itemCodigo);

        validateEntityExists(
          dados.item,
          ItemNotFoundError,
          'itemCodigo',
          itemCodigo,
          'Item',
          'M'  // ← adicionar gênero masculino
        );

        return {
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
            codigo: dados.grupoDeEstoque.grupoDeEstoqueCodigo,
            descricao: dados.grupoDeEstoque.grupoDeEstoqueDescricao
          } : null,
          estabelecimentos: dados.estabelecimentos.map(estab => ({
            codigo: estab.codigo,
            nome: estab.nome
          }))
        };
      },
      {
        entityName: 'item',
        codeFieldName: 'itemCodigo',
        codeValue: itemCodigo,
        operationName: 'buscar informações gerais'
      },
      ItemNotFoundError
    );
  }
}