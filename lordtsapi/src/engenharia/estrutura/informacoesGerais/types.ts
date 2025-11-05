/**
 * Tipos para estrutura de produtos (BOM - Bill of Materials) e processos de fabricação
 */

/**
 * Tempos de fabricação de uma operação
 */
export interface TemposOperacao {
  tempoHomemOriginal: number;
  tempoMaquinaOriginal: number;
  unidadeTempoCodigo: number; // 1=horas, 2=minutos, 3=segundos, 4=dias
  proporcao: number;
  horasHomemCalculadas: number;
  horasMaquinaCalculadas: number;
}

/**
 * Centro de custo
 */
export interface CentroCusto {
  codigo: string;
  descricao: string;
}

/**
 * Grupo de máquina
 */
export interface GrupoMaquina {
  codigo: string;
  descricao: string;
}

/**
 * Recursos utilizados na operação
 */
export interface RecursosOperacao {
  nrUnidades: number;
  numeroHomem: number;
  unidadeMedida: string;
  unidadeTempo: string; // 'h', 'm', 's', 'd'
}

/**
 * Operação do processo de fabricação
 */
export interface Operacao {
  codigo: number;
  descricao: string;
  estabelecimento: string;
  tempos: TemposOperacao;
  centroCusto: CentroCusto;
  grupoMaquina: GrupoMaquina;
  recursos: RecursosOperacao;
}

/**
 * Processo de fabricação (conjunto de operações)
 */
export interface ProcessoFabricacao {
  operacao: Operacao[];
}

/**
 * Item da estrutura (componente ou produto final)
 * Estrutura recursiva para representar a árvore de componentes
 */
export interface ItemEstrutura {
  codigo: string;
  estabelecimento: string;
  descricao: string;
  unidadeMedida: string;
  tipo?: string; // Tipo do item (posição 133 do char-1): 0 ou 4 = FINAL, outros = COMPONENTE
  pTipo?: string; // Tipo do item pai (apenas para componentes)
  cTipo?: string; // Tipo do componente (mesmo valor que tipo, para componentes)
  nivel: number;
  quantidadeEstrutura: number | null;
  quantidadeAcumulada: number;
  dataInicio?: string | null; // Data de início de validade (formato: YYYY-MM-DD)
  dataFim?: string | null; // Data de fim de validade (formato: YYYY-MM-DD)
  processoFabricacao: ProcessoFabricacao;
  componentes: ItemEstrutura[];
}

/**
 * Resumo de horas por centro de custo
 */
export interface ResumoHorasCentroCusto {
  estabelecimento: string;
  centroCusto: string;
  descricao: string;
  totalHoras: number;
  horasHomem: number;
  horasMaquina: number;
}

/**
 * Totais gerais de horas
 */
export interface TotaisHoras {
  totalGeralHoras: number;
  totalHorasHomem: number;
  totalHorasMaquina: number;
}

/**
 * Resumo de horas (por centro de custo e totais)
 */
export interface ResumoHoras {
  porCentroCusto: ResumoHorasCentroCusto[];
  totais: TotaisHoras;
}

/**
 * Metadados da consulta
 */
export interface Metadata {
  dataGeracao: string;
  itemPesquisado: string;
  estabelecimentoPrincipal: string;
  totalNiveis: number;
  totalItens: number;
  totalOperacoes: number;
}

/**
 * Estrutura completa retornada pela API
 */
export interface EstruturaCompleta {
  itemPrincipal: ItemEstrutura;
  resumoHoras: ResumoHoras;
  metadata: Metadata;
}

/**
 * Parâmetros de entrada para consulta
 */
export interface ConsultaEstruturaParams {
  itemCodigo: string;
  dataReferencia?: string; // formato ISO: YYYY-MM-DD
}

/**
 * Item da estrutura em formato plano (flat)
 * Útil para exportações e visualizações tabulares
 */
export interface ItemEstruturaFlat extends ItemEstrutura {
  nivel: number;
  path: string;
  parentPath: string | null;
}

/**
 * Estrutura formatada em modo flat
 */
export interface EstruturaFlat {
  metadata: Metadata;
  resumoHoras: ResumoHoras;
  items: ItemEstruturaFlat[];
  format: 'flat';
}

/**
 * Estrutura formatada em modo tree (padrão)
 */
export interface EstruturaTree extends EstruturaCompleta {
  format: 'tree';
}

/**
 * Resposta da API
 */
export interface EstruturaResponse {
  success: boolean;
  data: EstruturaCompleta;
  correlationId: string;
}
