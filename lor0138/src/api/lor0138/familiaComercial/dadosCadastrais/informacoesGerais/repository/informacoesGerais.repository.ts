// src/api/lor0138/familiaComercial/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

/**
 * Repository - Informações Gerais da Família Comercial
 * @module FamiliaComercialInformacoesGeraisRepository
 * @category Repositories
 */
export class FamiliaComercialInformacoesGeraisRepository {
  /**
   * Busca dados mestres de uma família comercial da tabela pub.fam-comerc do Progress
   */
  static async getFamiliaComercialMaster(familiaComercialCodigo: string): Promise<any | null> {
    try {
      const query = `
        DECLARE @familiaComercialCodigo varchar(8) = @paramFamiliaComercialCodigo;
        DECLARE @sql nvarchar(max);

        SET @sql = N'
          SELECT  familiaComercial."fm-cod-com" as familiaComercialCodigo
                , familiaComercial."descricao" as familiaComercialDescricao
            FROM  OPENQUERY (
              PRD_EMS2EMP
            ,  ''SELECT  familiaComercial."fm-cod-com"
                       , familiaComercial."descricao"
                   FROM   pub."fam-comerc" familiaComercial
                   WHERE  familiaComercial."fm-cod-com" = ''''' + @familiaComercialCodigo + '''''
               ''
            ) as familiaComercial
        ';

        EXEC sp_executesql @sql;
      `;

      const params: QueryParameter[] = [
        { name: 'paramFamiliaComercialCodigo', type: 'varchar', value: familiaComercialCodigo }
      ];

      const result = await QueryCacheService.withFamiliaComercialCache(
        query,
        params,
        async () => DatabaseManager.queryEmpWithParams(query, params)
      );

      return result && result.length > 0 ? result[0] : null;

    } catch (error) {
      console.error('Erro ao buscar familia comercial:', error);
      throw error;
    }
  }

  /**
   * Invalida cache de queries relacionadas a uma família comercial específica
   */
  static async invalidateCache(familiaComercialCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple([
      'familiaComercial:*',
    ]);

    console.log('Cache invalidado para familia comercial:', familiaComercialCodigo);
  }
}