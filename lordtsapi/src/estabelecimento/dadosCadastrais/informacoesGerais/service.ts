// src/estabelecimento/dadosCadastrais/informacoesGerais/service.ts

import { EstabelecimentoInformacoesGeraisRepository } from './repository';
import { EstabelecimentoNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';

export class InformacoesGeraisService {
  static async getInformacoesGerais(estabelecimentoCodigo: string): Promise<any | null> {
    return withErrorHandling(
      async () => {
        const dados = await EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster(estabelecimentoCodigo);

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
          descricao: dados.nome
        };
      },
      {
        entityName: 'estabelecimento',
        codeFieldName: 'estabelecimentoCodigo',
        codeValue: estabelecimentoCodigo,
        operationName: 'buscar informações gerais'
      },
      EstabelecimentoNotFoundError
    );
  }
}