/**
 * Tipos para Onde Usado (Where Used)
 * Percorre a estrutura de produtos de baixo para cima
 */

/**
 * Tempos de processamento de uma operação
 */
export interface TemposOperacao {
  tempoHomemOriginal: number;
  tempoMaquinaOriginal: number;
  unidadeTempoCodigo: number;
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
 * Recursos necessários para a operação
 */
export interface RecursosOperacao {
  nrUnidades: number;
  numeroHomem: number;
  unidadeMedida: string;
  unidadeTempo: string; // 'h', 'm', 's', 'd'
}

/**
 * Operação de fabricação
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
 * Item na árvore de onde usado
 * Representa um item que USA o componente
 */
export interface ItemOndeUsado {
  codigo: string;
  estabelecimento: string;
  descricao: string;
  unidadeMedida: string;
  tipo: string; // 'FINAL' ou 'COMPONENTE'
  nivel: number;
  quantidadeEstrutura?: number | null;
  quantidadeAcumulada: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  processoFabricacao: ProcessoFabricacao;
  /** Pais que usam este item (recursivo) */
  usadoEm?: ItemOndeUsado[];
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
 * Resumo consolidado de horas
 */
export interface ResumoHoras {
  porCentroCusto?: ResumoHorasCentroCusto[];
  totais?: TotaisHoras;
}

/**
 * Item final simplificado para lista de finais
 */
export interface ItemFinal {
  codigo: string;
  estabelecimento: string;
  descricao: string;
  unidadeMedida: string;
  quantidadeAcumulada: number;
  tipo: string; // Sempre será 'FINAL'
}

/**
 * Metadados da consulta
 */
export interface MetadataOndeUsado {
  dataGeracao: string; // ISO 8601
  itemPesquisado: string;
  estabelecimentoPrincipal?: string;
  totalNiveis: number;
  totalItens: number;
  totalOperacoes: number;
  modo?: string; // 'estruturaCompleta' ou 'apenasFinais'
}

/**
 * Estrutura completa de Onde Usado (Where Used)
 * Resposta principal da API
 */
export interface OndeUsadoCompleto {
  /** Item inicial (componente pesquisado) - Opcional: só vem no modo estrutura completa */
  itemPrincipal?: ItemOndeUsado;
  /** Lista simplificada de finais - Opcional: só vem no modo apenasFinais */
  listaFinais?: ItemFinal[];
  /** Resumo de horas consolidado */
  resumoHoras?: ResumoHoras;
  /** Metadados da consulta */
  metadata?: MetadataOndeUsado;
}
