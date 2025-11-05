// src/deposito/dadosCadastrais/informacoesGerais/service.ts

import { DepositoInformacoesGeraisRepository } from './repository';
import { DepositoNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import type { DepositoInformacoesGerais } from './types';

export class InformacoesGeraisService {
  static async getInformacoesGerais(
    depositoCodigo: string
  ): Promise<DepositoInformacoesGerais | null> {
    return withErrorHandling(
      async () => {
        const depositoData =
          await DepositoInformacoesGeraisRepository.getDepositoMaster(depositoCodigo);

        validateEntityExists(
          depositoData,
          DepositoNotFoundError,
          'depositoCodigo',
          depositoCodigo,
          'Depósito',
          'M'
        );

        // Os dados já vêm transformados do SQL, apenas retornamos
        return depositoData;
      },
      {
        entityName: 'depósito',
        codeFieldName: 'depositoCodigo',
        codeValue: depositoCodigo,
        operationName: 'buscar informações gerais',
      },
      DepositoNotFoundError
    );
  }
}
