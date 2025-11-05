// src/item/dadosCadastrais/manufatura/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { ItemQueries } from '@/item/queries';
import type { ItemManufaturaRaw } from './types';

/**
 * Repository - Informações de Manufatura do Item
 *
 * ✨ REFATORADO: Queries extraídas para arquivos .sql separados
 * @see ../../../queries/README.md para documentação completa
 */
export class ItemManufaturaRepository {
  /**
   * Busca informações de manufatura e produção do item
   *
   * Query: ../../../queries/get-item-manufatura.sql
   * Cache: 10 minutos (configurado em QueryCacheService)
   *
   * @param itemCodigo - Código do item a buscar
   * @returns Informações de manufatura do item ou null se não encontrado
   */
  static async getManufatura(itemCodigo: string): Promise<ItemManufaturaRaw[] | null> {
    // Carrega query do arquivo (cached em memória após primeira leitura)
    const query = ItemQueries.getItemManufatura();

    const params: QueryParameter[] = [{ name: 'codigo', type: 'varchar', value: itemCodigo }];

    const result = await QueryCacheService.withItemCache(query, params, async () =>
      DatabaseManager.datasul('emp').query<any>(query, params)
    );

    if (!result || result.length === 0) {
      return null;
    }

    // ODBC Progress retorna campos em lowercase, precisa mapear para camelCase
    const mapped = result.map((raw: any) => ({
      codigo: raw.codigo,
      descricao: raw.descricao,
      situacao: raw.situacao,
      tipoControle: raw.tipocontrole,
      tipoControleEstoque: raw.tipocontroleestoque,
      tipoRequisicao: raw.tiporequisicao,
      consideraAlocacaoAtividades:
        raw.consideraalocatividades === '1' || raw.consideraalocatividades === 1,
      programaAlocacaoAtividades:
        raw.programaalocatividades === '1' || raw.programaalocatividades === 1,
      taxaOverlap: raw.taxaoverlap,
      politica: raw.politica,
      demanda: raw.demanda,
      loteMultiplo: raw.lotemultiplo,
      loteMinimo: raw.loteminimo,
      loteEconomico: raw.loteeconomico,
      estoqueSegurancaTipo: raw.estoquesegurancatipo,
      estoqueSegurancaQuantidade: raw.estoquesegurancaqtd,
      periodoFixo: raw.periodofixo,
      pontoReposicao: raw.pontoreposicao,
      estoqueSegurancaTempo: raw.estoquesegurancatempo,
      estoqueSegurancaConverteTempo:
        raw.estoquesegurancaconvtempo === '1' || raw.estoquesegurancaconvtempo === 1,
      char1: raw.char1,
      mrpClaseReprogramacao: raw.mrpclassereprog,
      mrpEmissaoOrdens: raw.mrpemissaoordens,
      mrpControlePlanejamento: raw.mrpcontroleplanej,
      mrpDivisaoOrdens: raw.mrpdivisaoordens,
      mrpProcesso: raw.mrpprocesso,
      mrpRessuprimentoCompras: raw.mrpressupcompras,
      mrpRessuprimentoFornecedor: raw.mrpressupfornecedor,
      mrpRessuprimentoQualidade: raw.mrpressupqualidade,
      mrpRessuprimentoFabrica: raw.mrpressupfabrica,
      mrpRessuprimentoFabricaQualidade: raw.mrpressupfabricaqual,
      mrpRessuprimentoHorizonteFixo: raw.mrpressuphorizfixo,
      mrpPvMpsCrpPVOrigem: raw.mrppvorigem,
      mrpPvMpsCrpPVFormula: raw.mrppvformula,
      mrpPvMpsCrpMpsCriterioCalculo: raw.mrpmpscriterio,
      mrpPvMpsCrpMpsFatorCustoDistribuicao: raw.mrpmpsfatorcusto,
      mrpPvMpsCrpCrpPrioridade: raw.mrpcrpprioridade,
      mrpPvMpsCrpCrpProgramacao: raw.mrpcrpprogramacao,
    }));

    return mapped as ItemManufaturaRaw[];
  }

  static async invalidateCache(_itemCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['item:*']);
  }
}
