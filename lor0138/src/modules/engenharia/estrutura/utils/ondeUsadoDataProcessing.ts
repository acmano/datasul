// src/modules/engenharia/estrutura/utils/ondeUsadoDataProcessing.ts

import {
  ItemPrincipalOndeUsado,
  ItemOndeUsado,
  TreeNodeOndeUsado,
  FlatNodeOndeUsado,
} from '../types/ondeUsado.types';
import { Operacao, ProcessoFabricacao } from '../types/estrutura.types';

/**
 * Extrai operações do processo de fabricação
 * Backend retorna objeto único (não array) com array de operações
 */
const extractOperacoes = (processoFabricacao?: ProcessoFabricacao): Operacao[] => {
  if (!processoFabricacao?.operacao || !Array.isArray(processoFabricacao.operacao)) {
    return [];
  }
  return processoFabricacao.operacao;
};

/**
 * Converte ItemPrincipalOndeUsado ou ItemOndeUsado para TreeNodeOndeUsado
 * DIFERENÇA: usadoEm ao invés de componentes
 */
export const adaptOndeUsadoToTree = (item: ItemPrincipalOndeUsado): TreeNodeOndeUsado => {
  const adaptNode = (
    node: ItemPrincipalOndeUsado | ItemOndeUsado,
    isRoot = false
  ): TreeNodeOndeUsado => {
    const code =
      node?.codigo !== null && node?.codigo !== undefined ? String(node.codigo) : 'SEM_CODIGO';
    const name =
      node?.descricao !== null && node?.descricao !== undefined ? String(node.descricao) : code;
    const qty = isRoot ? 1 : 'quantidadeEstrutura' in node ? (node?.quantidadeEstrutura ?? 1) : 1;
    const process = extractOperacoes(node?.processoFabricacao);
    const hasProcess = process.length > 0;
    const nivel = node?.nivel ?? 0;
    const unidadeMedida = node?.unidadeMedida;
    const dataInicio = 'dataInicio' in node ? node.dataInicio : undefined;
    const dataFim = 'dataFim' in node ? node.dataFim : undefined;
    const estabelecimento = node?.estabelecimento;

    // ⚠️ DIFERENÇA: usadoEm ao invés de componentes
    const parents: ItemOndeUsado[] = Array.isArray(node?.usadoEm) ? node.usadoEm : [];
    const children = parents.map((parent) => adaptNode(parent, false));

    return {
      code,
      name,
      qty,
      children,
      hasProcess,
      process,
      nivel,
      unidadeMedida,
      dataInicio,
      dataFim,
      estabelecimento,
    };
  };

  return adaptNode(item, true);
};

/**
 * Achata a árvore de Onde Usado para uma lista linear com IDs únicos
 */
export const flattenOndeUsadoTree = (root: TreeNodeOndeUsado): FlatNodeOndeUsado[] => {
  const out: FlatNodeOndeUsado[] = [];

  const walk = (node: TreeNodeOndeUsado, level: number, path: string[]) => {
    const id = [...path, node.code].join('>');
    const parentId = path.length ? path.join('>') : undefined;

    out.push({
      id,
      level,
      code: node.code,
      name: node.name,
      qty: node.qty,
      qtyAcumulada: node.qtyAcumulada,
      parentId,
      hasChildren: node.children.length > 0,
      hasProcess: node.hasProcess,
      process: node.process,
      unidadeMedida: node.unidadeMedida,
      isValid: node.isValid,
      estabelecimento: node.estabelecimento,
    });

    node.children.forEach((ch) => walk(ch, level + 1, [...path, node.code]));
  };

  walk(root, 0, []);
  return out;
};

/**
 * Calcula o nível máximo da árvore de Onde Usado
 */
export const getOndeUsadoMaxLevel = (flatNodes: FlatNodeOndeUsado[]): number => {
  if (!flatNodes.length) {
    return 0;
  }
  return Math.max(...flatNodes.map((n) => n.level));
};

/**
 * Propaga quantidades recursivamente na estrutura de Onde Usado
 * Usado para modo de consumo
 */
export const propagarQuantidadesOndeUsado = (
  tree: TreeNodeOndeUsado,
  multiplicador: number
): TreeNodeOndeUsado => {
  const propagate = (node: TreeNodeOndeUsado, qtdAcumulada: number): TreeNodeOndeUsado => {
    const novaQtdAcumulada = qtdAcumulada * node.qty;

    const newChildren = node.children.map((child) => propagate(child, novaQtdAcumulada));

    return {
      ...node,
      qtyAcumulada: novaQtdAcumulada,
      children: newChildren,
    };
  };

  return propagate(tree, multiplicador);
};

/**
 * Interface para componente sumarizado no Onde Usado
 */
export interface ComponenteSumarizadoOndeUsado {
  codigo: string;
  descricao: string;
  unidadeMedida: string;
  quantidadeTotal: number;
  estabelecimento?: string;
  nivel?: number;
}

/**
 * Sumariza estrutura de Onde Usado (agrupa itens duplicados)
 * Útil para modo de consumo em lista
 */
export const sumarizarOndeUsado = (tree: TreeNodeOndeUsado): ComponenteSumarizadoOndeUsado[] => {
  const map = new Map<string, ComponenteSumarizadoOndeUsado>();

  const walk = (node: TreeNodeOndeUsado) => {
    const key = node.code;
    const qtdAcumulada = node.qtyAcumulada ?? node.qty;

    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.quantidadeTotal += qtdAcumulada;
    } else {
      map.set(key, {
        codigo: node.code,
        descricao: node.name,
        unidadeMedida: node.unidadeMedida || '',
        quantidadeTotal: qtdAcumulada,
        estabelecimento: node.estabelecimento,
        nivel: node.nivel,
      });
    }

    node.children.forEach(walk);
  };

  walk(tree);

  // Retornar array ordenado por código
  return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
};
