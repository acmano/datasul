// src/grupoDeEstoque/dadosCadastrais/informacoesGerais/service.ts

import { GrupoDeEstoqueInformacoesGeraisRepository } from './repository';
import { GrupoDeEstoqueNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import type { GrupoDeEstoqueInformacoesGerais } from './types';

export class InformacoesGeraisService {
  static async getInformacoesGerais(
    grupoDeEstoqueCodigo: string
  ): Promise<GrupoDeEstoqueInformacoesGerais | null> {
    return withErrorHandling(
      async () => {
        const grupoDeEstoqueData =
          await GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster(
            grupoDeEstoqueCodigo
          );

        validateEntityExists(
          grupoDeEstoqueData,
          GrupoDeEstoqueNotFoundError,
          'grupoDeEstoqueCodigo',
          grupoDeEstoqueCodigo,
          'Grupo de Estoque'
        );

        return {
          codigo: grupoDeEstoqueData.codigo,
          descricao: grupoDeEstoqueData.descricao,
        };
      },
      {
        entityName: 'grupo de estoque',
        codeFieldName: 'grupoDeEstoqueCodigo',
        codeValue: grupoDeEstoqueCodigo,
        operationName: 'buscar informações gerais',
      },
      GrupoDeEstoqueNotFoundError
    );
  }
}
