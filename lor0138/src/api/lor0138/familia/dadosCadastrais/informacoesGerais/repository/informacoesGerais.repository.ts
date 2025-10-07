// src/api/lor0138/familia/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

/**
 * Repository - Informações Gerais da Família
 * @module FamiliaInformacoesGeraisRepository
 * @category Repositories
 */
export class FamiliaInformacoesGeraisRepository {
  /**
   * Busca dados mestres de uma família da tabela pub.familia do Progress
   */
  static async getFamiliaMaster(familiaCodigo: string): Promise<any | null> {
    try {
      const query = `
        DECLARE @familiaCodigo varchar(16) = @paramfamiliaCodigo;
        DECLARE @sql nvarchar(max);

        SET @sql = N'
          SELECT  familia."fm-codigo" as familiaCodigo
                , familia."descricao" as familiaDescricao
            FROM  OPENQUERY (
              PRD_EMS2EMP
            ,  ''SELECT  familia."fm-codigo"
                       , familia."descricao"
                   FROM   pub.familia familia
                   WHERE  familia."fm-codigo" = ''''' + @familiaCodigo + '''''
               ''
            ) as familia
        ';

        EXEC sp_executesql @sql;
      `;

      const params: QueryParameter[] = [
        { name: 'paramfamiliaCodigo', type: 'varchar', value: familiaCodigo }
      ];

      const result = await QueryCacheService.withFamiliaCache(
        query,
        params,
        async () => DatabaseManager.queryEmpWithParams(query, params)
      );

      return result && result.length > 0 ? result[0] : null;

    } catch (error) {
      console.error('Erro ao buscar familia master:', error);
      throw error;
    }
  }

  /**
   * Invalida cache de queries relacionadas a uma família específica
   */
  static async invalidateCache(familiaCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple([
      'familia:*',
      'estabelecimento:*'
    ]);

    console.log('Cache invalidado para familia:', familiaCodigo);
  }
}