// src/item/dadosCadastrais/planejamento/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { ItemQueries } from '@/item/queries';
import type { ItemPlanejamentoRaw } from './types';

// Interface para dados de estabelecimento do MULT
interface EstabelecimentoMult {
  codigo?: string;
  nome?: string;
}

/**
 * Repository - Planejamento do Item
 *
 * ✨ REFATORADO: Queries extraídas para arquivos .sql separados
 * @see ../../../queries/README.md para documentação completa
 *
 * Multi-database:
 * - Query EMP: Busca dados de planejamento do item (get-item-planejamento.sql)
 * - Query MULT: Busca nomes dos estabelecimentos
 * - Merge feito em TypeScript
 */
export class ItemPlanejamentoRepository {
  /**
   * Busca informações de planejamento MRP do item
   *
   * Queries:
   * - EMP: ../../../queries/get-item-planejamento.sql (dados de planejamento)
   * - MULT: pub.estabelec (nomes dos estabelecimentos)
   *
   * Cache: 10 minutos (configurado em QueryCacheService)
   *
   * @param itemCodigo - Código do item a buscar
   * @returns Array de planejamento por estabelecimento ou null se não encontrado
   */
  static async getPlanejamento(itemCodigo: string): Promise<ItemPlanejamentoRaw[] | null> {
    // Carrega query do arquivo (cached em memória após primeira leitura)
    const queryEmp = ItemQueries.getItemPlanejamento();

    const params: QueryParameter[] = [{ name: 'codigo', type: 'varchar', value: itemCodigo }];

    // Query para buscar nomes dos estabelecimentos (MULT)
    const queryMult = `
      SELECT
        estabelec."cod-estabel" as codigo,
        estabelec.nome as nome
      FROM pub.estabelec estabelec
    `;

    // Executa queries em paralelo
    const [resultEmp, resultMult] = await Promise.all([
      QueryCacheService.withItemCache(queryEmp, params, async () =>
        DatabaseManager.datasul('emp').query<ItemPlanejamentoRaw>(queryEmp, params)
      ),
      DatabaseManager.datasul('mult').query<EstabelecimentoMult>(queryMult, []),
    ]);

    if (!resultEmp || resultEmp.length === 0) {
      return null;
    }

    // Cria mapa de estabelecimentos para lookup rápido
    const estabelecimentosMap = new Map<string, string>();
    if (resultMult && resultMult.length > 0) {
      resultMult.forEach((estab) => {
        if (estab.codigo) {
          estabelecimentosMap.set(estab.codigo.trim(), estab.nome?.trim() || '');
        }
      });
    }

    // OdbcConnection.normalizeOdbcResults() já retorna campos em camelCase correto
    const mapped = resultEmp.map((raw: any) => ({
      itemCodigo: raw.itemCodigo,
      itemDescricao: raw.itemDescricao,
      estabCodigo: raw.estabCodigo,
      estabNome: raw.estabCodigo ? estabelecimentosMap.get(raw.estabCodigo.trim()) || '' : '',
      depositoPadrao: raw.depositoPadrao,
      localizacao: raw.localizacao,
      situacao: raw.situacao,
      planejadorCodigo: raw.planejadorCodigo,
      planejadorNome: raw.planejadorNome,
      linhaProducaoCodigo: raw.linhaProducaoCodigo,
      linhaProducaoNome: raw.linhaProducaoNome,
      capacidadeEstoque: raw.capacidadeEstoque,
      consideraAlocAtividades:
        raw.consideraAlocAtividades === '1' || raw.consideraAlocAtividades === 1,
      programaAlocAtividades:
        raw.programaAlocAtividades === '1' || raw.programaAlocAtividades === 1,
      percentualOverlap: raw.percentualOverlap,
      reportaMOB: raw.reportaMOB,
      reportaGGF: raw.reportaGGF,
      tipoAlocacao: raw.tipoAlocacao,
      tipoRequisicao: raw.tipoRequisicao,
      processoCustos: raw.processoCustos,
      reporteProducao: raw.reporteProducao,
      tratamentoRefugo: raw.tratamentoRefugo,
      controlaEstoque: raw.controlaEstoque === '1' || raw.controlaEstoque === 1,
      precoFiscal: raw.precoFiscal === '1' || raw.precoFiscal === 1,
      refugoItemCodigo: raw.refugoItemCodigo,
      refugoItemDescricao: raw.refugoItemDescricao,
      refugoRelacaoItem: raw.refugoRelacaoItem,
      refugoFator: raw.refugoFator,
      refugoPerda: raw.refugoPerda,
      politica: raw.politica,
      demanda: raw.demanda,
      loteMultiplo: raw.loteMultiplo,
      loteMinimo: raw.loteMinimo,
      loteEconomico: raw.loteEconomico,
      periodoFixo: raw.periodoFixo,
      pontoReposicao: raw.pontoReposicao,
      estoqueSegurancaTipo: raw.estoqueSegurancaTipo,
      estoqueSegurancaQtd: raw.estoqueSegurancaQtd,
      estoqueSegurancaTempo: raw.estoqueSegurancaTempo,
      estoqueSegurancaConvTempo:
        raw.estoqueSegurancaConvTempo === '1' || raw.estoqueSegurancaConvTempo === 1,
      classeReprogramacao: raw.classeReprogramacao,
      emissaoOrdens: raw.emissaoOrdens,
      divisaoOrdens: raw.divisaoOrdens,
      prioridade: raw.prioridade,
      ressuprimentoComprasQuantidade: raw.ressuprimentoComprasQuantidade,
      ressuprimentoComprasFornecedor: raw.ressuprimentoComprasFornecedor,
      ressuprimentoComprasCQ: raw.ressuprimentoComprasCQ,
      ressuprimentoFabricaQuantidade: raw.ressuprimentoFabricaQuantidade,
      ressuprimentoFabricaCQ: raw.ressuprimentoFabricaCQ,
      ressuprimentoFabricaMinimo: raw.ressuprimentoFabricaMinimo,
      ressupFabVarTempo: raw.ressupFabVarTempo,
      ressupFabVarQuantidade: raw.ressupFabVarQuantidade,
    }));

    return mapped as ItemPlanejamentoRaw[];
  }

  static async invalidateCache(_itemCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['item:*']);
  }
}
