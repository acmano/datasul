// src/item/dadosCadastrais/dimensoes/service/index.ts

import { ItemDimensoesRepository } from './repository';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import type { ItemDimensoesResponse } from './types';

export class DimensoesService {
  static async getDimensoes(itemCodigo: string): Promise<ItemDimensoesResponse> {
    return withErrorHandling(
      async () => {
        const dados = await ItemDimensoesRepository.getDimensoes(itemCodigo);

        validateEntityExists(dados, ItemNotFoundError, 'itemCodigo', itemCodigo, 'Item', 'M');

        return {
          itemCodigo: dados.itemCodigo,
          itemDescricao: dados.itemDescricao,
          peca: {
            altura: dados.pecaAltura,
            largura: dados.pecaLargura,
            profundidade: dados.pecaProfundidade,
            peso: dados.pecaPeso,
          },
          item: {
            pecas: dados.pecasItem,
            embalagem: {
              altura: dados.itemEmbalagemAltura,
              largura: dados.itemEmbalagemLargura,
              profundidade: dados.itemEmbalagemProfundidade,
              peso: dados.itemEmbalagemPeso,
            },
            embalado: {
              altura: dados.itemEmbaladoAltura,
              largura: dados.itemEmbaladoLargura,
              profundidade: dados.itemEmbaladoProfundidade,
              peso: dados.itemEmbaladoPeso,
            },
          },
          produto: {
            itens: dados.itensProduto,
            gtin13: dados.produtoGTIN13,
            embalagem: {
              altura: dados.produtoEmbalagemAltura,
              largura: dados.produtoEmbalagemLargura,
              profundidade: dados.produtoEmbalagemProfundidade,
              peso: dados.produtoEmbalagemPeso,
            },
            embalado: {
              altura: dados.produtoEmbaladoAltura,
              largura: dados.produtoEmbaladoLargura,
              profundidade: dados.produtoEmbaladoProfundidade,
              peso: dados.produtoEmbaladoPeso,
            },
          },
          caixa: {
            produtos: dados.produtosCaixa,
            gtin14: dados.caixaGTIN14,
            embalagem: {
              sigla: dados.embalagemSigla,
              altura: dados.embalagemAltura,
              largura: dados.embalagemLargura,
              profundidade: dados.embalagemProfundidade,
              peso: dados.embalagemPeso,
            },
          },
          palete: {
            lastro: dados.paleteLastro,
            camadas: dados.paleteCamadas,
            caixasPalete: dados.caixasPalete,
          },
        };
      },
      {
        entityName: 'dimensões do item',
        codeFieldName: 'itemCodigo',
        codeValue: itemCodigo,
        operationName: 'buscar dimensões',
      },
      ItemNotFoundError
    );
  }
}
