// @ts-nocheck
// src/api/lor0138/item/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

/**
 * Repository para consultas de Informações Gerais do Item
 */
export class ItemInformacoesGeraisRepository {
  
  /**
   * Busca dados mestres do item (COM CACHE - TTL: 10 minutos)
   */
  static async getItemMaster(itemCodigo: string): Promise<any | null> {
    try {
      const query = `
        DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
        DECLARE @sql nvarchar(max);
        
        SET @sql = N'
          SELECT 
            item."it-codigo" as itemCodigo,
            item."desc-item" as itemDescricao,
            item."un" as itemUnidade
          FROM OPENQUERY(PRD_EMS2EMP, ''
            SELECT 
              item."it-codigo",
              item."desc-item", 
              item."un"
            FROM pub.item
            WHERE item."it-codigo" = ''''' + @itemCodigo + '''''
          '') as item
        ';
        
        EXEC sp_executesql @sql;
      `;

      const params: QueryParameter[] = [
        { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo }
      ];

      // ✅ Query com cache L1/L2 (TTL: 10 minutos)
      const result = await QueryCacheService.withItemCache(
        query,
        params,
        async () => DatabaseManager.queryEmpWithParams(query, params)
      );
      
      return result && result.length > 0 ? result[0] : null;
      
    } catch (error) {
      console.error('Erro ao buscar item master:', error);
      throw error;
    }
  }

  /**
   * Busca estabelecimentos do item (COM CACHE - TTL: 15 minutos)
   */
  static async getItemEstabelecimentos(itemCodigo: string): Promise<any[]> {
    try {
      const query = `
        DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
        DECLARE @sql nvarchar(max);
        
        SET @sql = N'
          SELECT 
            itemEstab."it-codigo" as itemCodigo,
            itemEstab."cod-estabel" as estabCodigo,
            estab."nome" as estabNome,
            itemEstab."cod-obsoleto" as codObsoleto
          FROM OPENQUERY(PRD_EMS2EMP, ''
            SELECT 
              "item-uni-estab"."it-codigo",
              "item-uni-estab"."cod-estabel",
              "item-uni-estab"."cod-obsoleto"
            FROM pub."item-uni-estab"
            WHERE "item-uni-estab"."it-codigo" = ''''' + @itemCodigo + '''''
          '') as itemEstab
          LEFT JOIN OPENQUERY(PRD_EMS2MULT, ''
            SELECT 
              estabelec."ep-codigo" as cod_estabel,
              estabelec."nome"
            FROM pub.estabelec
          '') as estab ON itemEstab."cod-estabel" = estab.cod_estabel
        ';
        
        EXEC sp_executesql @sql;
      `;

      const params: QueryParameter[] = [
        { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo }
      ];

      // ✅ Query com cache L1/L2 (TTL: 15 minutos)
      const result = await QueryCacheService.withEstabelecimentoCache(
        query,
        params,
        async () => DatabaseManager.queryEmpWithParams(query, params)
      );
      
      return result || [];
      
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error);
      throw error;
    }
  }

  /**
   * Invalida cache do item (chamar após UPDATE/DELETE)
   */
  static async invalidateCache(itemCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple([
      'item:*',
      'estabelecimento:*'
    ]);
    console.log('Cache invalidado para item:', itemCodigo);
  }
}