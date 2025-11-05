// src/estabelecimento/dadosCadastrais/informacoesGerais/service.ts

import { EstabelecimentoInformacoesGeraisRepository } from './repository';
import { EstabelecimentoNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import type { EstabelecimentoInformacoesGerais } from './types';

export class InformacoesGeraisService {
  static async getInformacoesGerais(
    estabelecimentoCodigo: string
  ): Promise<EstabelecimentoInformacoesGerais | null> {
    return withErrorHandling(
      async () => {
        const dados =
          await EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster(
            estabelecimentoCodigo
          );

        validateEntityExists(
          dados,
          EstabelecimentoNotFoundError,
          'estabelecimentoCodigo',
          estabelecimentoCodigo,
          'Estabelecimento',
          'M'
        );

        return {
          codigo: dados.codigo.trim(),
          nome: dados.nome.trim(),
        };
      },
      {
        entityName: 'estabelecimento',
        codeFieldName: 'estabelecimentoCodigo',
        codeValue: estabelecimentoCodigo,
        operationName: 'buscar informações gerais',
      },
      EstabelecimentoNotFoundError
    );
  }
}
