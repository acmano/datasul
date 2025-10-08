// src/estabelecimento/dadosCadastrais/informacoesGerais/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

export class EstabelecimentoInformacoesGeraisRepository {
  static async getEstabelecimentoMaster(estabelecimentoCodigo: string): Promise<any | null> {
    try {
      const query = `
        DECLARE @estabelecimentoCodigo varchar(16) = @paramEstabelecimentoCodigo;
        DECLARE @sql nvarchar(max);

        SET @sql = N'
          SELECT  estabelec.codigo
                , estabelec.nome
            FROM  OPENQUERY (
              PRD_EMS2MULT
            , ''SELECT  estabelec."cod-estabel" as codigo
                      , estabelec."nome" as nome
                  FROM  pub.estabelec estabelec
                  WHERE estabelec."cod-estabel" = ''''' + @estabelecimentoCodigo + '''''
              ''
            ) as estabelec
        ';

        EXEC sp_executesql @sql;
      `;

      const params: QueryParameter[] = [
        { name: 'paramEstabelecimentoCodigo', type: 'varchar', value: estabelecimentoCodigo }
      ];

      const result = await QueryCacheService.withEstabelecimentoCache(
        query,
        params,
        async () => DatabaseManager.queryMultWithParams(query, params)
      );

      return result && result.length > 0 ? result[0] : null;

    } catch (error) {
      throw error;
    }
  }

  static async invalidateCache(estabelecimentoCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['estabelecimento:*']);
  }
}