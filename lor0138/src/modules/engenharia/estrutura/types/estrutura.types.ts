// src/modules/engenharia/estrutura/types/estrutura.types.ts

/**
 * Tipos para o módulo de Estrutura de Engenharia
 */

export interface Tempos {
  tempoHomemOriginal?: number;
  tempoMaquinaOriginal?: number;
  unidadeTempoCodigo?: number;
  proporcao?: number;
  horasHomemCalculadas?: number;
  horasMaquinaCalculadas?: number;
}

export interface CentroCusto {
  codigo?: string;
  descricao?: string;
}

export interface GrupoMaquina {
  codigo?: string;
  descricao?: string;
}

export interface Recursos {
  nrUnidades?: number;
  numeroHomem?: number;
  unidadeMedida?: string;
  unidadeTempo?: string;
}

export interface Operacao {
  codigo?: number | string;
  descricao?: string;
  estabelecimento?: string;
  tempos?: Tempos;
  centroCusto?: CentroCusto;
  grupoMaquina?: GrupoMaquina;
  recursos?: Recursos;
}

export interface ProcessoFabricacao {
  operacao?: Operacao[]; // Array de operações (alinhado com backend)
}

export interface Componente {
  codigo: string;
  estabelecimento?: string;
  descricao?: string;
  unidadeMedida?: string;
  nivel: number;
  quantidadeEstrutura?: number;
  quantidadeAcumulada?: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  processoFabricacao?: ProcessoFabricacao;
  componentes?: Componente[];
}

export interface ItemPrincipal {
  codigo: string;
  estabelecimento?: string;
  descricao?: string;
  unidadeMedida?: string;
  nivel: number;
  quantidadeAcumulada?: number;
  processoFabricacao?: ProcessoFabricacao;
  componentes?: Componente[];
}

export interface EstruturaResponse {
  success: boolean;
  data?: {
    itemPrincipal: ItemPrincipal;
  };
  error?: string;
}

/**
 * Tipos para processamento de dados em árvore
 */

export interface TreeNode {
  code: string;
  name: string;
  qty: number;
  qtyAcumulada?: number; // Quantidade propagada recursivamente (para estrutura de consumo)
  children: TreeNode[];
  hasProcess: boolean;
  process: Operacao[];
  nivel: number;
  unidadeMedida?: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  isValid?: boolean; // Indica se o componente está ativo na data de referência
  estabelecimento?: string;
}

export interface FlatNode {
  id: string; // caminho único com ">"
  level: number;
  code: string;
  name: string;
  qty: number;
  qtyAcumulada?: number; // Quantidade propagada recursivamente (para estrutura de consumo)
  parentId?: string;
  hasChildren: boolean;
  hasProcess: boolean;
  process: Operacao[];
  unidadeMedida?: string;
  isValid?: boolean; // Indica se o componente está ativo na data de referência
  estabelecimento?: string;
}

/**
 * Tipos para visualizações ECharts
 */

export interface SankeyNode {
  name: string;
  idPath: string;
  code: string;
  estabelecimento?: string;
  level: number;
  qty?: number;
  qtyAcumulada?: number;
  hasProcess: boolean;
  process?: Operacao[];
  itemStyle?: any;
  label?: any;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface GraphNode {
  id: string;
  name: string;
  code?: string;
  estabelecimento?: string;
  value?: number;
  symbolSize: number;
  itemStyle: any;
  label?: any;
  hasProcess: boolean;
  process?: Operacao[];
}

export interface GraphLink {
  source: string;
  target: string;
  value?: number;
  label?: any;
}

/**
 * Tipo para seleção de visualização
 */
export type VisualizationType = 'tabela' | 'sankey' | 'arvore' | 'treemap' | 'grafo';

/**
 * Tipos para estrutura de consumo
 */
export type TipoEstrutura = 'engenharia' | 'consumo';
export type ModoApresentacao = 'estrutura' | 'lista';

export interface EstruturaState {
  tipoEstrutura: TipoEstrutura;
  quantidadeMultiplicador: number; // Padrão: 1
  modoApresentacao: ModoApresentacao; // Só usado em consumo
  dataReferencia: string;
  mostrarHistorico: boolean;
}

export interface ComponenteSumarizado {
  codigo: string;
  descricao: string;
  unidadeMedida: string;
  quantidadeTotal: number;
  estabelecimento?: string;
  nivel?: number;
}
