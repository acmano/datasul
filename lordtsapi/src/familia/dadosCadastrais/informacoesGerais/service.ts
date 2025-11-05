// src/familia/dadosCadastrais/informacoesGerais/service.ts

import { FamiliaInformacoesGeraisRepository } from './repository';
import { FamiliaNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import type { FamiliaInformacoesGerais } from './types';

export class InformacoesGeraisService {
  static async getInformacoesGerais(
    familiaCodigo: string
  ): Promise<FamiliaInformacoesGerais | null> {
    return withErrorHandling(
      async () => {
        const familiaData =
          await FamiliaInformacoesGeraisRepository.getFamiliaMaster(familiaCodigo);

        validateEntityExists(
          familiaData,
          FamiliaNotFoundError,
          'familiaCodigo',
          familiaCodigo,
          'Família'
        );

        return {
          codigo: familiaData.codigo,
          descricao: familiaData.descricao,
        };
      },
      {
        entityName: 'família',
        codeFieldName: 'familiaCodigo',
        codeValue: familiaCodigo,
        operationName: 'buscar informações gerais',
      },
      FamiliaNotFoundError
    );
  }
}
