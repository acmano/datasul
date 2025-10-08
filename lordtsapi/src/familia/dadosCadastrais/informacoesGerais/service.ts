// src/familia/dadosCadastrais/informacoesGerais/service.ts

import { FamiliaInformacoesGeraisRepository } from './repository';
import { FamiliaNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';

export class InformacoesGeraisService {
  static async getInformacoesGerais(familiaCodigo: string): Promise<any | null> {
    return withErrorHandling(
      async () => {
        const familiaData = await FamiliaInformacoesGeraisRepository.getFamiliaMaster(familiaCodigo);

        validateEntityExists(
          familiaData,
          FamiliaNotFoundError,
          'familiaCodigo',
          familiaCodigo,
          'Família'
        );

        return {
          codigo: familiaData.familiaCodigo,
          descricao: familiaData.familiaDescricao,
        };
      },
      {
        entityName: 'família',
        codeFieldName: 'familiaCodigo',
        codeValue: familiaCodigo,
        operationName: 'buscar informações gerais'
      },
      FamiliaNotFoundError
    );
  }
}