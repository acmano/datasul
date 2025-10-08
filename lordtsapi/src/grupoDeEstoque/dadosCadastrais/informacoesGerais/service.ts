// src/grupoDeEstoque/dadosCadastrais/informacoesGerais/service.ts

import { GrupoDeEstoqueInformacoesGeraisRepository } from './repository';
import { GrupoDeEstoqueNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';

export class InformacoesGeraisService {
  static async getInformacoesGerais(grupoDeEstoqueCodigo: string): Promise<any | null> {
    return withErrorHandling(
      async () => {
        const grupoDeEstoqueData = await GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster(grupoDeEstoqueCodigo);

        validateEntityExists(
          grupoDeEstoqueData,
          GrupoDeEstoqueNotFoundError,
          'grupoDeEstoqueCodigo',
          grupoDeEstoqueCodigo,
          'Grupo de Estoque'
        );

        return {
          codigo: grupoDeEstoqueData.grupoDeEstoqueCodigo,
          descricao: grupoDeEstoqueData.grupoDeEstoqueDescricao,
        };
      },
      {
        entityName: 'grupo de estoque',
        codeFieldName: 'grupoDeEstoqueCodigo',
        codeValue: grupoDeEstoqueCodigo,
        operationName: 'buscar informações gerais'
      },
      GrupoDeEstoqueNotFoundError
    );
  }
}