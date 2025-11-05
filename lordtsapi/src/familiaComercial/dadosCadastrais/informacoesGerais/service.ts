// src/familiaComercial/dadosCadastrais/informacoesGerais/service.ts

import { FamiliaComercialInformacoesGeraisRepository } from './repository';
import { FamiliaComercialNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import type { FamiliaComercialInformacoesGerais } from './types';

export class InformacoesGeraisService {
  static async getInformacoesGerais(
    familiaComercialCodigo: string
  ): Promise<FamiliaComercialInformacoesGerais | null> {
    return withErrorHandling(
      async () => {
        const familiaComercialData =
          await FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster(
            familiaComercialCodigo
          );

        validateEntityExists(
          familiaComercialData,
          FamiliaComercialNotFoundError,
          'familiaComercialCodigo',
          familiaComercialCodigo,
          'Família Comercial'
        );

        return {
          codigo: familiaComercialData.codigo,
          descricao: familiaComercialData.descricao,
        };
      },
      {
        entityName: 'família comercial',
        codeFieldName: 'familiaComercialCodigo',
        codeValue: familiaComercialCodigo,
        operationName: 'buscar informações gerais',
      },
      FamiliaComercialNotFoundError
    );
  }
}
