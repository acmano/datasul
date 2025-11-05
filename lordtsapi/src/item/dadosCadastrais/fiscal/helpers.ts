// src/item/dadosCadastrais/fiscal/helpers.ts

import type { RawItemFiscal, ItemFiscalRaw } from './types';

/**
 * Transformation Helpers - Fiscal Data
 *
 * Funções que transformam dados RAW do Progress para formato da API.
 * Substitui transformações T-SQL (CHOOSE, CASE, FORMAT, etc.) por TypeScript.
 *
 * Motivo: Performance e manutenibilidade
 * - SQL busca apenas dados RAW (mais rápido)
 * - Transformações em TypeScript (mais testável e flexível)
 */

/**
 * Formata tipo de descrição (CHOOSE)
 * Progress values: 1-10
 */
export function formatFormaDescricao(value: number | null): string {
  if (value === null) return '';

  const options = [
    'Descrição',
    'Descrição + Narrativa',
    'Descrição + Narrativa Item/Cli',
    'Descrição + Narrativa Inform',
    'Narrativa Item',
    'Uma linha Narrativa',
    'Narrativa Informada',
    'Descrição + 24 Narrativa Item/Cli',
    'Descrição + 24 Narrativa Informada',
    'Descrição + 24 Narrativa Item',
  ];

  return options[value - 1] || '';
}

/**
 * Formata forma de obtenção (CHOOSE)
 * Progress values: 1=Comprado, 2=Fabricado
 */
export function formatFormaObtencao(value: number | null): string {
  if (value === null) return '';

  const options = ['Comprado', 'Fabricado'];
  return options[value - 1] || '';
}

/**
 * Formata boolean para Sim/Não
 * Progress: 0=Não, 1=Sim (ou outros valores truthy)
 */
export function formatSimNao(value: number | boolean | null): string {
  if (value === null) return 'Não';
  return value ? 'Sim' : 'Não';
}

/**
 * Formata tipo de controle (CHOOSE)
 * Progress values: 1-5
 */
export function formatTipoControle(value: number | null): string {
  if (value === null) return '';

  const options = ['Físico', 'Total', 'Consignado', 'Débito Direto', 'Não Definido'];
  return options[value - 1] || '';
}

/**
 * Formata tipo de controle de estoque (CHOOSE)
 * Progress values: 1-4
 */
export function formatTipoControleEstoque(value: number | null): string {
  if (value === null) return '';

  const options = ['Serial', 'Número de Série', 'Lote', 'Referência'];
  return options[value - 1] || '';
}

/**
 * Formata classificação fiscal (STUFF + padding)
 * Progress: "12345678" → "1234.56.78"
 */
export function formatClassificacaoFiscal(code: string | null): string {
  if (!code) return '';

  const padded = code.padStart(8, '0');
  return `${padded.substring(0, 4)}.${padded.substring(4, 6)}.${padded.substring(6, 8)}`;
}

/**
 * Formata NCM (FORMAT com 3 dígitos)
 * Progress: decimal → "000" format
 */
export function formatNCM(ncm: number | null): string {
  if (ncm === null) return '';
  return String(ncm).padStart(3, '0');
}

/**
 * Formata código de tributação (CHOOSE)
 * Progress values: 1-4
 */
export function formatCodigoTributacao(value: number | null): string {
  if (value === null) return '';

  const options = ['Tributado', 'Isento', 'Outros', 'Reduzido'];
  return options[value - 1] || '';
}

/**
 * Formata tipo de apuração IPI (CHOOSE)
 * Progress values: 1=Decendial, 2=Quinzenal
 */
export function formatIpiApuracao(value: number | null): string {
  if (value === null) return '';

  const options = ['Decendial', 'Quinzenal'];
  return options[value - 1] || '';
}

/**
 * Verifica se IPI está suspenso (SUBSTRING de char-2)
 * Progress: char-2[52] = '2' → Sim
 */
export function formatIpiSuspenso(itemChar2: string | null): string {
  if (!itemChar2 || itemChar2.length < 52) return 'Não';
  return itemChar2[51] === '2' ? 'Sim' : 'Não'; // index 51 = position 52
}

/**
 * Formata cálculo PIS/COFINS (CHOOSE)
 * Progress values: 1=Percentual, 2=Valor por Unidade
 */
export function formatCalculoTipo(value: number | null): string {
  if (value === null) return '';

  const options = ['Percentual', 'Valor por Unidade'];
  return options[value - 1] || '';
}

/**
 * Formata origem da alíquota (SUBSTRING de char-2)
 * Progress: char-2[52] value → 1=Item, 2=Natureza
 */
export function formatAliquotaOrigem(itemChar2: string | null): string {
  if (!itemChar2 || itemChar2.length < 52) return '';

  const value = itemChar2[51]; // index 51 = position 52
  return value === '1' ? 'Item' : 'Natureza';
}

/**
 * Extrai e formata alíquota do char-2
 * Progress: SUBSTRING(char-2, 31, 5) com vírgula → decimal
 */
export function extractAliquota(itemChar2: string | null): number | null {
  if (!itemChar2 || itemChar2.length < 36) return null;

  const substring = itemChar2.substring(30, 35).trim(); // positions 31-35
  if (!substring) return null;

  const normalized = substring.replace(',', '.');
  const value = parseFloat(normalized);
  return isNaN(value) ? null : value;
}

/**
 * Extrai e formata percentual de redução do char-2
 * Progress: SUBSTRING(char-2, 41, 5) com vírgula → decimal
 */
export function extractPercentualReducao(itemChar2: string | null): number | null {
  if (!itemChar2 || itemChar2.length < 46) return null;

  const substring = itemChar2.substring(40, 45).trim(); // positions 41-45
  if (!substring) return null;

  const normalized = substring.replace(',', '.');
  const value = parseFloat(normalized);
  return isNaN(value) ? null : value;
}

/**
 * Formata origem de retenção
 * Progress: '0'=Natureza, outros=Item
 */
export function formatRetencaoOrigem(value: string | null): string {
  if (!value) return '';
  return value === '0' ? 'Natureza' : 'Item';
}

/**
 * Transforma dados RAW do Progress para formato da API
 */
export function transformItemFiscal(raw: RawItemFiscal): ItemFiscalRaw {
  return {
    itemCodigo: raw.cod,
    itemDescricao: raw.descricao,
    itemGeraisFormaDescricao: formatFormaDescricao(raw.geraisformdesc),
    itemGeraisFormaObtencao: formatFormaObtencao(raw.geraisformobt),
    itemGeraisQuantidadeFracionada: formatSimNao(raw.geraisfrac),
    itemGeraisLoteMultiplo: raw.geraislote,
    itemGeraisUnidadeNegocioCodigo: raw.geraisuncod,
    itemGeraisUnidadeNegocioNome: raw.geraisunnome,
    itemGeraisOrigemUnidadeTributaria: '', // Campo vazio conforme query original
    itemComplementaresTipoControle: formatTipoControle(raw.comptipoctrl),
    itemComplementaresTipoControleEstoque: formatTipoControleEstoque(raw.comptipocest),
    itemComplementaresEmissaoNf: '', // Campo vazio conforme query original
    itemComplementaresFaturavel: formatSimNao(raw.compfat),
    itemComplementaresBaixaEstoque: formatSimNao(raw.compbaixa),
    itemFiscalServico: raw.fiscserv,
    itemFiscalClassificacaoCodigo: formatClassificacaoFiscal(raw.fiscclasscod),
    itemFiscalClassificacaoNcm: formatNCM(raw.fiscclassncm),
    itemFiscalClassificacaoNome: raw.fiscclassnome,
    itemFiscalIpiCodigoTributacao: formatCodigoTributacao(raw.fiscipicodtrib),
    itemFiscalIpiAliquota: raw.fiscipialiq,
    itemFiscalIpiApuracao: formatIpiApuracao(raw.fiscipiapurac),
    itemFiscalIpiSuspenso: formatIpiSuspenso(raw.itemchar2),
    itemFiscalIpiDiferenciado: formatSimNao(raw.fiscipidife),
    itemFiscalIpiIncentivado: formatSimNao(raw.fiscipiincent),
    itemFiscalIpiCombustivelSolvente: formatSimNao(raw.fiscipicombust),
    itemFiscalIpiFamiliaCodigo: raw.fiscipifamcod,
    itemFiscalIpiFamiliaNome: raw.fiscipifamnome,
    itemFiscalIcmsCodigo: formatCodigoTributacao(raw.fiscicmscodtrib),
    itemFiscalIcsmFatorReajuste: raw.fiscicmsfator,
    itemFiscalIssCodigoTributacao: raw.fiscisscodtrib,
    itemFiscalIssAliquota: raw.fiscissaliq,
    itemFiscalInssServicoCodigo: '', // Campo vazio conforme query original
    itemFiscalDcr: raw.fiscdcr,
    itemFiscalSefazSp: raw.fiscsefaz,
    itemPisCofinsPisCalculoPorUnidade: formatCalculoTipo(raw.piscalc),
    itemPisCofinsPisValorPorUnidade: raw.pisvalor,
    itemPisCofinsPisAliquotaOrigem: formatAliquotaOrigem(raw.itemchar2),
    itemPisCofinsPisAliquota: extractAliquota(raw.itemchar2),
    itemPisCofinsPisPercentualReducao: extractPercentualReducao(raw.itemchar2),
    itemPisCofinsPisRetencaoPercentual: raw.pisretenc,
    itemPisCofinsPisRetencaoOrigem: formatRetencaoOrigem(raw.pisretorig),
    itemPisCofinsCofinsCalculoPorUnidade: formatCalculoTipo(raw.cofinscalc),
    itemPisCofinsCofinsValorPorUnidade: raw.cofinsvalor,
    itemPisCofinsCofinsAliquotaOrigem: formatAliquotaOrigem(raw.itemchar2),
    itemPisCofinsCofinsAliquota: extractAliquota(raw.itemchar2), // Same extraction for now
    itemPisCofinsCofinsPercentualReducao: extractPercentualReducao(raw.itemchar2), // Same extraction
    itemPisCofinsCofinsRetencaoPercentual: raw.cofinsretenc,
    itemPisCofinsCofinsRetencaoOrigem: formatRetencaoOrigem(raw.cofinsretorig),
  };
}
