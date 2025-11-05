// src/modules/engenharia/estrutura/types/ondeUsado.types.ts

/**
 * Tipos para Onde Usado (Where Used) - Consulta Inversa da Estrutura
 * Mostra em quais produtos um componente é utilizado
 */

import { ProcessoFabricacao, Operacao } from './estrutura.types';

/**
 * Item final simplificado (para modo apenasFinais)
 */
export interface ItemFinal {
  codigo: string;
  estabelecimento: string;
  descricao: string;
  unidadeMedida: string;
  quantidadeAcumulada: number;
  tipo: string; // Sempre 'FINAL'
}

/**
 * Item que usa o componente (pai na hierarquia)
 */
export interface ItemOndeUsado {
  codigo: string;
  estabelecimento?: string;
  descricao?: string;
  unidadeMedida?: string;
  nivel: number;
  quantidadeEstrutura?: number;
  quantidadeAcumulada?: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  tipo?: string; // Tipo do item (ex: 'FINAL', 'INTERMEDIARIO')
  processoFabricacao?: ProcessoFabricacao;
  usadoEm?: ItemOndeUsado[]; // INVERSO: ao invés de "componentes", é "usadoEm"
}

/**
 * Item principal do Onde Usado (componente pesquisado - raiz)
 */
export interface ItemPrincipalOndeUsado {
  codigo: string;
  estabelecimento?: string;
  descricao?: string;
  unidadeMedida?: string;
  nivel: number;
  quantidadeAcumulada?: number;
  tipo?: string; // Tipo do item (ex: 'FINAL', 'INTERMEDIARIO')
  processoFabricacao?: ProcessoFabricacao;
  usadoEm?: ItemOndeUsado[]; // INVERSO
}

/**
 * Resumo de horas por centro de custo
 */
export interface ResumoHorasCentroCusto {
  estabelecimento?: string;
  centroCusto?: string;
  descricao?: string;
  totalHoras?: number;
  horasHomem?: number;
  horasMaquina?: number;
}

/**
 * Totais de horas
 */
export interface ResumoHorasTotais {
  totalGeralHoras?: number;
  totalHorasHomem?: number;
  totalHorasMaquina?: number;
}

/**
 * Resumo de horas
 */
export interface ResumoHoras {
  porCentroCusto?: ResumoHorasCentroCusto[];
  totais?: ResumoHorasTotais;
}

/**
 * Metadata da consulta de Onde Usado
 */
export interface OndeUsadoMetadata {
  dataGeracao?: string;
  itemPesquisado?: string;
  estabelecimentoPrincipal?: string;
  totalNiveis?: number;
  totalItens?: number;
  totalOperacoes?: number;
  modo?: 'estruturaCompleta' | 'apenasFinais'; // Modo de exibição
}

/**
 * Response da API de Onde Usado
 */
export interface OndeUsadoResponse {
  success: boolean;
  data?: {
    itemPrincipal?: ItemPrincipalOndeUsado; // Opcional - modo estrutura completa
    listaFinais?: ItemFinal[]; // Opcional - modo apenas finais
    resumoHoras?: ResumoHoras;
    metadata?: OndeUsadoMetadata;
  };
  error?: string;
  correlationId?: string;
}

/**
 * TreeNode para visualização de Onde Usado
 * Similar ao TreeNode da estrutura, mas representa hierarquia invertida
 */
export interface TreeNodeOndeUsado {
  code: string;
  name: string;
  qty: number;
  qtyAcumulada?: number;
  children: TreeNodeOndeUsado[]; // "usadoEm" mapeado para "children"
  hasProcess: boolean;
  process: Operacao[];
  nivel: number;
  unidadeMedida?: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  isValid?: boolean;
  estabelecimento?: string;
}

/**
 * FlatNode para tabelas de Onde Usado
 */
export interface FlatNodeOndeUsado {
  id: string;
  level: number;
  code: string;
  name: string;
  qty: number;
  qtyAcumulada?: number;
  parentId?: string;
  hasChildren: boolean;
  hasProcess: boolean;
  process: Operacao[];
  unidadeMedida?: string;
  isValid?: boolean;
  estabelecimento?: string;
}
