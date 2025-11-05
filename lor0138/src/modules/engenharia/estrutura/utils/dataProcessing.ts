// src/modules/engenharia/estrutura/utils/dataProcessing.ts

import {
  ItemPrincipal,
  Componente,
  TreeNode,
  FlatNode,
  Operacao,
  ProcessoFabricacao,
} from '../types/estrutura.types';

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
 * Converte ItemPrincipal ou Componente para TreeNode
 */
export const adaptToTree = (item: ItemPrincipal): TreeNode => {
  const adaptNode = (node: ItemPrincipal | Componente, isRoot = false): TreeNode => {
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

    const kids: Componente[] = Array.isArray(node?.componentes) ? node.componentes : [];
    const children = kids.map((ch) => adaptNode(ch, false));

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
 * Achata a árvore para uma lista linear com IDs únicos
 */
export const flattenTree = (root: TreeNode): FlatNode[] => {
  const out: FlatNode[] = [];

  const walk = (node: TreeNode, level: number, path: string[]) => {
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
 * Calcula o nível máximo da árvore
 */
export const getMaxLevel = (flatNodes: FlatNode[]): number => {
  if (!flatNodes.length) {
    return 0;
  }
  return Math.max(...flatNodes.map((n) => n.level));
};

/**
 * Obtém ancestrais de um nó pelo ID
 */
export const getAncestors = (id: string): string[] => {
  const parts = id.split('>');
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    out.push(parts.slice(0, i + 1).join('>'));
  }
  return out;
};

/**
 * Propaga quantidades recursivamente pela estrutura
 * @param node - Nó da estrutura
 * @param multiplicadorAcumulado - Multiplicador do pai (inicia com quantidadeMultiplicador do usuário)
 * @returns Nova estrutura com quantidades propagadas
 */
export const propagarQuantidades = (
  node: TreeNode,
  multiplicadorAcumulado: number = 1
): TreeNode => {
  // Calcular quantidade propagada deste nó
  const qtdPropagada = (node.qty || 0) * multiplicadorAcumulado;

  // Se não tem filhos, retornar nó atualizado
  if (!node.children || node.children.length === 0) {
    return {
      ...node,
      qtyAcumulada: qtdPropagada,
    };
  }

  // Propagar para filhos recursivamente
  const childrenPropagados = node.children.map((filho) => propagarQuantidades(filho, qtdPropagada));

  return {
    ...node,
    qtyAcumulada: qtdPropagada,
    children: childrenPropagados,
  };
};

/**
 * Sumariza estrutura em lista única por código
 * @param node - Estrutura completa
 * @returns Array de componentes sumarizados
 */
export const sumarizarEstrutura = (node: TreeNode): any[] => {
  const mapa = new Map<string, any>();

  const percorrer = (n: TreeNode) => {
    // Pular item raiz (nível 0)
    if (n.nivel > 0) {
      const chave = n.code;

      if (mapa.has(chave)) {
        // Somar quantidade se já existe
        const existente = mapa.get(chave)!;
        existente.quantidadeTotal += n.qtyAcumulada || n.qty || 0;
      } else {
        // Adicionar novo
        mapa.set(chave, {
          codigo: n.code,
          descricao: n.name,
          unidadeMedida: n.unidadeMedida || '',
          quantidadeTotal: n.qtyAcumulada || n.qty || 0,
          estabelecimento: n.estabelecimento || '',
          nivel: n.nivel,
        });
      }
    }

    // Percorrer filhos
    if (n.children) {
      n.children.forEach(percorrer);
    }
  };

  percorrer(node);

  // Retornar array ordenado por código
  return Array.from(mapa.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
};
