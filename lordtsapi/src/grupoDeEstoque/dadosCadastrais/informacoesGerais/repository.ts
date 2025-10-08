// src/grupoDeEstoque/dadosCadastrais/informacoesGerais/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

export class GrupoDeEstoqueInformacoesGeraisRepository {
  static async getGrupoDeEstoqueMaster(grupoDeEstoqueCodigo: string): Promise<any | null> {
    const query = `
      DECLARE @grupoDeEstoqueCodigo varchar(16) = @paramGrupoDeEstoqueCodigo;
      DECLARE @sql nvarchar(max);

      SET @sql = N'
        SELECT  entity."ge-codigo" as grupoDeEstoqueCodigo
              , entity."descricao" as grupoDeEstoqueDescricao
          FROM  OPENQUERY (
            PRD_EMS2EMP
          ,  ''SELECT  entity."ge-codigo"
                     , entity."descricao"
                 FROM   pub."grup-estoque" entity
                 WHERE  entity."ge-codigo" = ''''' + @grupoDeEstoqueCodigo + '''''
             ''
          ) as entity
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
  }

  static async invalidateCache(grupoDeEstoqueCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['grupoDeEstoque:*']);
  }
}