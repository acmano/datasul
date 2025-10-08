// src/familiaComercial/dadosCadastrais/informacoesGerais/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

export class FamiliaComercialInformacoesGeraisRepository {
  static async getFamiliaComercialMaster(familiaComercialCodigo: string): Promise<any | null> {
    const query = `
      DECLARE @familiaComercialCodigo varchar(16) = @paramFamiliaComercialCodigo;
      DECLARE @sql nvarchar(max);

      SET @sql = N'
        SELECT  entity."fm-cod-com" as familiaComercialCodigo
              , entity."descricao" as familiaComercialDescricao
          FROM  OPENQUERY (
            PRD_EMS2EMP
          ,  ''SELECT  entity."fm-cod-com"
                     , entity."descricao"
                 FROM   pub."fam-comerc" entity
                 WHERE  entity."fm-cod-com" = ''''' + @familiaComercialCodigo + '''''
             ''
          ) as entity
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
  }

  static async invalidateCache(familiaComercialCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['familiaComercial:*']);
  }
}