// src/item/dadosCadastrais/informacoesGerais/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { log } from '@shared/utils/logger';
import { ItemQueries } from '@/item/queries';

// Import types
import type {
  ItemMasterQueryResult,
  ItemEstabelecimentoQueryResult,
  ItemInformacoesGerais,
} from './types';

// Tipos RAW retornados pelo Progress ODBC (camelCase via SQL aliases)
interface ItemMasterRawEmp {
  itemCodigo?: string;
  itemDescricao?: string;
  itemUnidade?: string;
  itemUnidadeDescricao?: string;
  familiaCodigo?: number | string | null;
  familiaComercialCodigo?: number | string | null;
  grupoDeEstoqueCodigo?: number | string | null;
  deposito?: string;
  codLocalizacao?: string;
  status?: string;
  estabelecimentoPadraoCodigo?: string;
  dataImplantacao?: string;
  dataLiberacao?: string;
  dataObsolescencia?: string;
  narrativa?: string;
  descricaoAlternativa?: string;
  vendaEmbCodigo?: string;
  vendaEmbDescricao?: string;
  vendaEmbItens?: number;
}

interface ItemMasterRawEsp {
  itemCodigo?: string;
  endereco?: string;
  descricaoResumida?: string;
  contenedorCodigo?: string;
  contenedorDescricao?: string;
  teCodigo?: string;
}

/**
 * Repository - Informações Gerais do Item (com estrutura aninhada)
 *
 * ✨ REFATORADO: Queries extraídas para arquivos .sql separados
 * @see ../../../queries/README.md para documentação completa
 */
export class ItemInformacoesGeraisRepository {
  /**
   * Busca dados mestres do item com códigos de relacionamento
   *
   * ✨ MIGRADO PARA ODBC:
   * - Query get-item-emp-main.sql (EMP database - item + unidade + embalagem venda)
   * - Query get-item-esp-extended.sql (ESP database - dados estendidos + contenedor)
   * - Query get-item-emp-embalagem.sql (EMP database - descrição embalagem TE) - condicional
   * - Merge dos 3 resultados feito em TypeScript
   *
   * Cache: 10 minutos (configurado em QueryCacheService)
   *
   * @param itemCodigo - Código do item a buscar
   * @returns Dados mestres do item ou null se não encontrado
   */
  static async getItemMaster(itemCodigo: string): Promise<ItemMasterQueryResult | null> {
    const params: QueryParameter[] = [
      { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo },
    ];

    // Executa queries EMP e ESP em paralelo
    const [empResult, espResult] = await Promise.all([
      // Query 1: Dados principais (EMP) - retorna lowercase
      DatabaseManager.datasul('emp').query<ItemMasterRawEmp>(ItemQueries.getItemEmpMain(), params),
      // Query 2: Dados estendidos (ESP) - retorna lowercase
      DatabaseManager.datasul('esp').query<ItemMasterRawEsp>(
        ItemQueries.getItemEspExtended(),
        params
      ),
    ]);

    // Se item não existe no EMP, retorna null
    if (!empResult || empResult.length === 0) {
      return null;
    }

    const empDataRaw = empResult[0];
    const espDataRaw = espResult && espResult.length > 0 ? espResult[0] : null;

    // Transform from camelCase (SQL aliases) to camelCase (TypeScript)
    // NOTE: Progress ODBC may return codes as numbers - convert to strings
    const empData = {
      itemCodigo: empDataRaw?.itemCodigo || '',
      itemDescricao: empDataRaw?.itemDescricao || '',
      itemUnidade: empDataRaw?.itemUnidade || '',
      itemUnidadeDescricao: empDataRaw?.itemUnidadeDescricao || '',
      // Convert numeric codes to strings (Progress ODBC behavior)
      familiaCodigo: empDataRaw?.familiaCodigo != null ? String(empDataRaw.familiaCodigo) : null,
      familiaComercialCodigo:
        empDataRaw?.familiaComercialCodigo != null
          ? String(empDataRaw.familiaComercialCodigo)
          : null,
      grupoDeEstoqueCodigo:
        empDataRaw?.grupoDeEstoqueCodigo != null ? String(empDataRaw.grupoDeEstoqueCodigo) : null,
      deposito: empDataRaw?.deposito || '',
      codLocalizacao: empDataRaw?.codLocalizacao || '',
      status: empDataRaw?.status || '',
      estabelecimentoPadraoCodigo: empDataRaw?.estabelecimentoPadraoCodigo || '',
      dataImplantacao: empDataRaw?.dataImplantacao || '',
      dataLiberacao: empDataRaw?.dataLiberacao || '',
      dataObsolescencia: empDataRaw?.dataObsolescencia || '',
      narrativa: empDataRaw?.narrativa,
      vendaEmbCodigo: empDataRaw?.vendaEmbCodigo,
      vendaEmbDescricao: empDataRaw?.vendaEmbDescricao,
      vendaEmbItens: empDataRaw?.vendaEmbItens,
    };

    const espData = espDataRaw?.itemCodigo
      ? {
          itemCodigo: espDataRaw.itemCodigo,
          endereco: espDataRaw.endereco,
          descricaoResumida: espDataRaw.descricaoResumida,
          descricaoAlternativa: empDataRaw?.descricaoAlternativa,
          contenedorCodigo: espDataRaw.contenedorCodigo,
          contenedorDescricao: espDataRaw.contenedorDescricao,
          teCodigo: espDataRaw.teCodigo,
        }
      : {};

    // Query 3: Descrição da embalagem TE (EMP) - condicional
    let teDescricao: string | undefined;
    if (espData.teCodigo) {
      const embParams: QueryParameter[] = [
        { name: 'paramEmbalagemCodigo', type: 'varchar', value: espData.teCodigo },
      ];

      const embResult = await DatabaseManager.datasul('emp').query<{ teDescricao: string }>(
        ItemQueries.getItemEmpEmbalagem(),
        embParams
      );

      if (embResult && embResult.length > 0) {
        teDescricao = embResult[0]?.teDescricao;
      }
    }

    // Merge dos 3 resultados
    const merged: ItemMasterQueryResult = {
      ...empData,
      ...espData,
      teDescricao,
    } as ItemMasterQueryResult;

    log.debug('=== ITEM MASTER MIGRADO (3 queries) ===', {
      itemCodigo: merged.itemCodigo,
      temEsp: !!espData.itemCodigo,
      temTE: !!teDescricao,
    });

    return merged;
  }

  /**
   * Busca estabelecimentos do item
   *
   * Query: ../../../queries/get-item-estabelecimentos.sql
   * Cache: 10 minutos (configurado em QueryCacheService)
   *
   * @param itemCodigo - Código do item a buscar
   * @returns Lista de estabelecimentos onde o item está cadastrado
   */
  static async getItemEstabelecimentos(
    itemCodigo: string
  ): Promise<ItemEstabelecimentoQueryResult[]> {
    // Carrega query do arquivo (cached em memória após primeira leitura)
    const query = ItemQueries.getItemEstabelecimentos();

    const params: QueryParameter[] = [
      { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo },
    ];

    const result = await QueryCacheService.withEstabelecimentoCache(query, params, async () =>
      DatabaseManager.datasul('emp').query<ItemEstabelecimentoQueryResult>(query, params)
    );

    return (result as ItemEstabelecimentoQueryResult[]) || [];
  }

  /**
   * Busca dados completos do item incluindo todos os relacionamentos
   * REFATORADO: Retorna APENAS códigos para evitar loops de requisições
   */
  static async getItemCompleto(itemCodigo: string): Promise<ItemInformacoesGerais> {
    // PASSO 1: Busca item e estabelecimentos em paralelo
    const [itemData, estabelecimentosData] = await Promise.all([
      this.getItemMaster(itemCodigo),
      this.getItemEstabelecimentos(itemCodigo),
    ]);

    // Se item não existe, retorna tudo null/vazio
    if (!itemData) {
      return {
        item: null,
        familia: null,
        familiaComercial: null,
        grupoDeEstoque: null,
        estabelecimentos: [],
      };
    }

    // PASSO 2: Retorna APENAS códigos (sem enriquecimento)
    // Frontend deve buscar detalhes usando os endpoints específicos se necessário
    log.info('📦 Retornando códigos sem enriquecimento', {
      familia: itemData.familiaCodigo,
      familiaComercial: itemData.familiaComercialCodigo,
      grupoEstoque: itemData.grupoDeEstoqueCodigo,
      estabelecimentos: estabelecimentosData.length,
    });

    return {
      item: itemData,
      familia: null,
      familiaComercial: null,
      grupoDeEstoque: null,
      estabelecimentos: estabelecimentosData.map((estab) => ({
        codigo: estab.estabelecimentoCodigo,
        nome: 'Carregue detalhes separadamente', // Frontend fará isso on-demand
      })),
    };
  }

  /**
   * Invalida cache do item
   */
  static async invalidateCache(_itemCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['item:*', 'estabelecimento:*']);
  }
}
