// src/item/dadosCadastrais/informacoesGerais/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { log } from '@shared/utils/logger';

import { FamiliaInformacoesGeraisRepository } from '@/familia/dadosCadastrais/informacoesGerais/repository';
import { FamiliaComercialInformacoesGeraisRepository } from '@/familiaComercial/dadosCadastrais/informacoesGerais/repository';
import { GrupoDeEstoqueInformacoesGeraisRepository } from '@/grupoDeEstoque/dadosCadastrais/informacoesGerais/repository';
import { EstabelecimentoInformacoesGeraisRepository } from '@/estabelecimento/dadosCadastrais/informacoesGerais/repository';

/**
 * Repository - Informações Gerais do Item (com estrutura aninhada)
 */
export class ItemInformacoesGeraisRepository {

  /**
   * Busca dados mestres do item com códigos de relacionamento
   */
  static async getItemMaster(itemCodigo: string): Promise<any | null> {
    try {
      const query = `
        DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
        DECLARE @sql nvarchar(max);

        SET @sql = N'
          SELECT  item.itemCodigo
                , item.itemDescricao
                , item.itemUnidade
                , item.familiaCodigo
                , item.familiaComercialCodigo
                , CAST(item.grupoDeEstoqueCodigo AS varchar(2)) as grupoDeEstoqueCodigo
          FROM  OPENQUERY (
            PRD_EMS2EMP
          ,  ''SELECT  item."it-codigo"  as itemCodigo
                    , item."desc-item"  as itemDescricao
                    , item."un"         as itemUnidade
                    , item."fm-codigo"  as familiaCodigo
                    , item."fm-cod-com" as familiaComercialCodigo
                    , item."ge-codigo"  as grupoDeEstoqueCodigo
                FROM  pub.item item
                WHERE item."it-codigo" = ''''' + @itemCodigo + '''''
          '') as item
        ';

        EXEC sp_executesql @sql;
      `;

      const params: QueryParameter[] = [
        { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo }
      ];

      const result = await QueryCacheService.withItemCache(
        query,
        params,
        async () => DatabaseManager.queryEmpWithParams(query, params)
      );

      return result && result.length > 0 ? result[0] : null;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca estabelecimentos do item
   */
  static async getItemEstabelecimentos(itemCodigo: string): Promise<any[]> {
    try {
      const query = `
        DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
        DECLARE @sql nvarchar(max);

        SET @sql = N'
          SELECT  itemUniEstab.itemCodigo
                , itemUniEstab.estabelecimentoCodigo
                , estabelec.estabelecimentoNome
          FROM  OPENQUERY (
            PRD_EMS2EMP,
            ''SELECT  itemUniEstab."it-codigo"    as itemCodigo
                    , itemUniEstab."cod-estabel"  as estabelecimentoCodigo
                FROM  pub."item-uni-estab" itemUniEstab
                WHERE itemUniEstab."it-codigo" = ''''' + @itemCodigo + '''''
                ORDER BY  itemUniEstab."cod-estabel"''
          ) as itemUniEstab
          INNER JOIN OPENQUERY (
            PRD_EMS2MULT,
            ''SELECT  estabelec."cod-estabel" as estabelecimentoCodigo
                    , estabelec.nome          as estabelecimentoNome
                FROM   pub.estabelec estabelec''
          ) as estabelec
            ON  estabelec.estabelecimentoCodigo = itemUniEstab.estabelecimentoCodigo;
        ';
        EXEC sp_executesql @sql;
      `;

      const params: QueryParameter[] = [
        { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo }
      ];

      const result = await QueryCacheService.withEstabelecimentoCache(
        query,
        params,
        async () => DatabaseManager.queryEmpWithParams(query, params)
      );

      return result || [];

    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca dados completos do item incluindo todos os relacionamentos
   * Executa queries em paralelo para máxima performance
   */
  static async getItemCompleto(itemCodigo: string): Promise<{
    item: any | null;
    familia: any | null;
    familiaComercial: any | null;
    grupoDeEstoque: any | null;
    estabelecimentos: any[];
  }> {
    try {
      // PASSO 1: Busca item e estabelecimentos em paralelo
      const [itemData, estabelecimentosData] = await Promise.all([
        this.getItemMaster(itemCodigo),
        this.getItemEstabelecimentos(itemCodigo)
      ]);

      // Se item não existe, retorna tudo null/vazio
      if (!itemData) {
        return {
          item: null,
          familia: null,
          familiaComercial: null,
          grupoDeEstoque: null,
          estabelecimentos: []
        };
      }

      // PASSO 2: Busca relacionamentos em paralelo (se existirem e forem válidos)
      const isValidCode = (code: any): code is string => {
        return code !== null && code !== undefined && typeof code === 'string' && code.trim() !== '';
      };

      const [familiaData, familiaComercialData, grupoDeEstoqueData] = await Promise.all([
        isValidCode(itemData.familiaCodigo)
          ? FamiliaInformacoesGeraisRepository.getFamiliaMaster(itemData.familiaCodigo)
          : Promise.resolve(null),
        isValidCode(itemData.familiaComercialCodigo)
          ? FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster(itemData.familiaComercialCodigo)
          : Promise.resolve(null),
        isValidCode(itemData.grupoDeEstoqueCodigo)
          ? GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster(itemData.grupoDeEstoqueCodigo)
          : Promise.resolve(null)
      ]);

      // PASSO 3: Enriquecer estabelecimentos com dados completos (em paralelo)
      const estabelecimentosEnriquecidos = await Promise.all(
        estabelecimentosData.slice(0, 50).map(async (estab) => {
          try {
            const dadosCompletos = await EstabelecimentoInformacoesGeraisRepository
              .getEstabelecimentoMaster(estab.estabelecimentoCodigo);

            return {
              codigo: estab.estabelecimentoCodigo,
              nome: dadosCompletos?.nome || 'Nome não disponível'
            };
          } catch (error) {
            log.error(`Erro ao buscar estabelecimento ${estab.estabelecimentoCodigo}`, {
              error: error instanceof Error ? error.message : error
            });
            return {
              codigo: estab.estabelecimentoCodigo,
              nome: 'Erro ao carregar'
            };
          }
        })
      );

      log.info('📦 Estabelecimentos enriquecidos', {
        total: estabelecimentosEnriquecidos.length,
        dados: estabelecimentosEnriquecidos
      });

      return {
        item: itemData,
        familia: familiaData,
        familiaComercial: familiaComercialData,
        grupoDeEstoque: grupoDeEstoqueData,
        estabelecimentos: estabelecimentosEnriquecidos
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Invalida cache do item
   */
  static async invalidateCache(itemCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple([
      'item:*',
      'estabelecimento:*'
    ]);
  }
}