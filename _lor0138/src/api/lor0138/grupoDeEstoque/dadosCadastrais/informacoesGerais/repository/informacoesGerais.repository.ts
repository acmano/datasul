// src/api/lor0138/grupoDeEstoque/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

/**
 * Repository - Informações Gerais do Grupo de Estoque
 * @module GrupoDeEstoqueInformacoesGeraisRepository
 * @category Repositories
 */
export class GrupoDeEstoqueInformacoesGeraisRepository {
  /**
   * Busca dados mestres de um grupo de estoque da tabela pub.grupo_estoque do Progress
   */
  static async getGrupoDeEstoqueMaster(grupoDeEstoqueCodigo: string): Promise<any | null> {
    try {
      const query = `
        DECLARE @grupoDeEstoqueCodigo varchar(2) = @paramGrupoDeEstoqueCodigo;
        DECLARE @sql nvarchar(max);

        SET @sql = N'
          SELECT  grupo."ge-codigo" as grupoCodigo
                , grupo."descricao" as grupoDescricao
            FROM  OPENQUERY (
              PRD_EMS2EMP
            ,  ''SELECT  grupo."ge-codigo"
                       , grupo."descricao"
                   FROM  pub."grup-estoque" grupo
                   WHERE grupo."ge-codigo" = ''''' + @grupoDeEstoqueCodigo + '''''
               ''
            ) as grupo
        ';

        EXEC sp_executesql @sql;
      `;

      const params: QueryParameter[] = [
        { name: 'paramGrupoDeEstoqueCodigo', type: 'varchar', value: grupoDeEstoqueCodigo }
      ];

      const result = await QueryCacheService.withGrupoDeEstoqueCache(
        query,
        params,
        async () => DatabaseManager.queryEmpWithParams(query, params)
      );

      return result && result.length > 0 ? result[0] : null;

    } catch (error) {
      console.error('Erro ao buscar grupo de estoque:', error);
      throw error;
    }
  }

  /**
   * Invalida cache de queries relacionadas a uma grupo de estoque específico
   */
  static async invalidateCache(grupoDeEstoqueCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple([
      'grupo:*',
    ]);

    console.log('Cache invalidado para grupo de estoque:', grupoDeEstoqueCodigo);
  }
}