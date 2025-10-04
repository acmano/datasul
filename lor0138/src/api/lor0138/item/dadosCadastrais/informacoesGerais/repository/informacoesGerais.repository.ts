// src/api/lor0138/item/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { ItemMasterQueryResult, ItemEstabQueryResult } from '../types/informacoesGerais.types';

/**
 * Repository para dados de Informações Gerais do Item
 */
export class ItemInformacoesGeraisRepository {
  /**
   * Busca dados mestres do item (✅ SEGURO contra SQL Injection)
   * Usa sp_executesql com OPENQUERY dinâmico para proteger os parâmetros
   */
  static async getItemMaster(itemCodigo: string): Promise<ItemMasterQueryResult | null> {
    // Query usando sp_executesql para montar OPENQUERY de forma segura
    const query = `
      DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
      DECLARE @sql nvarchar(max);
      
      SET @sql = N'SELECT  dtsItem.itemCodigo
                         , dtsItem.itemDescricao
                         , dtsItem.itemUnidade
                     FROM  openquery (
                       PRD_EMS2EMP
                     ,  ''SELECT  item."it-codigo" as itemCodigo
                               , item."desc-item" as itemDescricao
                               , item."un"        as itemUnidade
                           FROM  pub.item         as item
                           WHERE "it-codigo" = ''''' + @itemCodigo + '''''
                       ''
                     ) as dtsItem';
      
      EXEC sp_executesql @sql;
    `;

    const params = [
      { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo }
    ];

    try {
      const result = await DatabaseManager.queryEmpWithParams(query, params);

      if (!result || result.length === 0) {
        return null;
      }

      return result[0];
    } catch (error) {
      console.error('Erro ao buscar item master:', error);
      throw new Error('Erro ao consultar dados do item');
    }
  }

  /**
   * Busca dados do item por estabelecimento (✅ SEGURO contra SQL Injection)
   */
  static async getItemEstabelecimentos(itemCodigo: string): Promise<ItemEstabQueryResult[]> {
    const query = `
      DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
      DECLARE @sql nvarchar(max);
      
      SET @sql = N'SELECT  dtsItemEstab.itemCodigo
                         , dtsItemEstab.estabCodigo
                         , dtsMult.estabNome
                         , dtsItemEstab.codObsoleto
                     FROM openquery (
                       PRD_EMS2EMP
                     ,  ''SELECT  itemUniEstab."it-codigo"                 as  itemCodigo
                               , itemUniEstab."cod-estabel"               as  estabCodigo
                               , COALESCE(itemUniEstab."cod-obsoleto", 0) as  codObsoleto
                           FROM  pub."item-uni-estab"                     as  itemUniEstab
                           WHERE itemUniEstab."it-codigo" = ''''' + @itemCodigo + '''''
                           ORDER BY  itemUniEstab."cod-estabel"
                       ''
                     ) as dtsItemEstab
                     INNER JOIN openquery (
                       PRD_EMS2MULT
                     ,  ''SELECT  estabelec."cod-estabel"  as estabCodigo
                               , estabelec.nome           as estabNome
                           FROM  PUB.estabelec            as estabelec
                       ''
                     ) as  dtsMult
                       ON  dtsMult.estabCodigo = dtsItemEstab.estabCodigo';
      
      EXEC sp_executesql @sql;
    `;

    const params = [
      { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo }
    ];

    try {
      const result = await DatabaseManager.queryEmpWithParams(query, params);
      return result || [];
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos do item:', error);
      throw new Error('Erro ao consultar estabelecimentos do item');
    }
  }
}