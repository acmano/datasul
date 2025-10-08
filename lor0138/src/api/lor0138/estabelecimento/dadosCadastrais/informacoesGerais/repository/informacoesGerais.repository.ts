// src/api/lor0138/estabelecimento/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

/**
 * Repository - Informações Gerais do Estabelecimento
 */
export class EstabelecimentoInformacoesGeraisRepository {

  /**
   * Busca dados do estabelecimento por código
   */
  static async getEstabelecimentoMaster(estabelecimentoCodigo: string): Promise<any | null> {
    try {
      // Formata código para 5 posições com espaços à direita (101 -> "101  ")
      const codigoFormatado = estabelecimentoCodigo.padEnd(5, ' ');

      const query = `
        DECLARE @estabelecimentoCodigo varchar(5) = @paramEstabelecimentoCodigo;
        DECLARE @sql nvarchar(max);

        SET @sql = N'
          SELECT
            estabelec.codigo,
            estabelec.nome
          FROM OPENQUERY(PRD_EMS2MULT, ''
            SELECT
              "cod-estabel" as codigo,
              nome
            FROM pub.estabelec
            WHERE "cod-estabel" = ''''' + @estabelecimentoCodigo + '''''
          '') as estabelec
        ';

        EXEC sp_executesql @sql;
      `;

      const params: QueryParameter[] = [
        { name: 'paramEstabelecimentoCodigo', type: 'varchar', value: codigoFormatado }
      ];

      const result = await QueryCacheService.withEstabelecimentoCache(
        query,
        params,
        async () => DatabaseManager.queryMultWithParams(query, params)
      );

      return result && result.length > 0 ? result[0] : null;

    } catch (error) {
      console.error('Erro ao buscar estabelecimento master:', error);
      throw error;
    }
  }

  /**
   * Invalida cache do estabelecimento
   */
  static async invalidateCache(estabelecimentoCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['estabelecimento:*']);
    console.log('Cache invalidado para estabelecimento:', estabelecimentoCodigo);
  }
}