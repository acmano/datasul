// src/modules/engenharia/estrutura/utils/chartBuilders.ts

import { TreeNode, SankeyNode, SankeyLink, GraphNode, GraphLink } from '../types/estrutura.types';
import { formatarCodigoComEstab } from './formatters';

/**
 * Helper para obter a quantidade correta (acumulada ou direta)
 */
const getQty = (node: TreeNode): number => {
  return node.qtyAcumulada !== undefined ? node.qtyAcumulada : node.qty;
};

/**
 * Constrói dados para o diagrama Sankey
 * @param reverse - Se true, inverte o fluxo (para Onde Usado)
 */
export const buildSankeyData = (
  root: TreeNode,
  getLevelCss: (level: number) => string,
  getLevelText: (level: number) => string,
  selectedId?: string | null,
  showQty = true,
  reverse = false
) => {
  const nodesMap = new Map<string, SankeyNode>();
  const links: SankeyLink[] = [];

  const walk = (node: TreeNode, level: number, path: string[]) => {
    const id = [...path, node.code].join('>');
    const nodeQty = getQty(node);
    if (!nodesMap.has(id)) {
      nodesMap.set(id, {
        name: id,
        idPath: id,
        code: node.code,
        estabelecimento: node.estabelecimento,
        level,
        qty: nodeQty,
        qtyAcumulada: node.qtyAcumulada,
        hasProcess: node.hasProcess,
        process: node.process,
        itemStyle: {
          color: getLevelCss(level),
          borderColor: selectedId === id ? '#4b9cff' : node.hasProcess ? '#333' : '#aaa',
          borderWidth: selectedId === id ? 3 : node.hasProcess ? 2 : 1,
        },
        label: {
          show: true,
          position: 'inside',
          color: getLevelText(level),
          fontWeight: 600,
          overflow: 'truncate',
          formatter: (p: any) => {
            const code = p.data.code;
            const estab = p.data.estabelecimento;
            const displayCode = formatarCodigoComEstab(code, estab);
            const qty =
              p.data.qtyAcumulada !== undefined ? p.data.qtyAcumulada : (p.data.qty ?? '');
            const hasProcess = p.data.hasProcess;
            const icon = hasProcess ? '⚙️ ' : '';
            return showQty ? `${icon}${displayCode} (${qty})` : `${icon}${displayCode}`;
          },
        },
      });
    }

    for (const ch of node.children) {
      const cid = [...path, node.code, ch.code].join('>');
      const childQty = getQty(ch);
      if (!nodesMap.has(cid)) {
        nodesMap.set(cid, {
          name: cid,
          idPath: cid,
          code: ch.code,
          estabelecimento: ch.estabelecimento,
          level: level + 1,
          qty: childQty,
          qtyAcumulada: ch.qtyAcumulada,
          hasProcess: ch.hasProcess,
          process: ch.process,
          itemStyle: {
            color: getLevelCss(level + 1),
            borderColor: selectedId === cid ? '#4b9cff' : ch.hasProcess ? '#333' : '#aaa',
            borderWidth: selectedId === cid ? 3 : ch.hasProcess ? 2 : 1,
          },
          label: {
            show: true,
            position: 'inside',
            color: getLevelText(level + 1),
            fontWeight: 600,
            overflow: 'truncate',
            formatter: (p: any) => {
              const code = p.data.code;
              const estab = p.data.estabelecimento;
              const displayCode = formatarCodigoComEstab(code, estab);
              const qty =
                p.data.qtyAcumulada !== undefined ? p.data.qtyAcumulada : (p.data.qty ?? '');
              const hasProcess = p.data.hasProcess;
              const icon = hasProcess ? '⚙️ ' : '';
              return showQty ? `${icon}${displayCode} (${qty})` : `${icon}${displayCode}`;
            },
          },
        });
      }
      // Se reverse, inverte source/target para fluxo direita → esquerda (Onde Usado)
      if (reverse) {
        links.push({ source: cid, target: id, value: childQty ?? 1 });
      } else {
        links.push({ source: id, target: cid, value: childQty ?? 1 });
      }
      walk(ch, level + 1, [...path, node.code]);
    }
  };

  walk(root, 0, []);
  return { nodes: Array.from(nodesMap.values()), links };
};

/**
 * Constrói dados para a visualização em Árvore
 */
export const buildTreeData = (
  root: TreeNode,
  getLevelCss: (level: number) => string,
  selectedId?: string | null,
  showQty = true
) => {
  const toTree = (node: TreeNode, level: number, path: string[]): any => {
    const idPath = [...path, node.code].join('>');
    const isSel = selectedId === idPath;
    const nodeQty = getQty(node);

    const children = node.children
      .map((c) => toTree(c, level + 1, [...path, node.code]))
      .filter(Boolean);

    return {
      name: formatarCodigoComEstab(node.code, node.estabelecimento),
      code: node.code,
      estabelecimento: node.estabelecimento,
      idPath,
      qty: nodeQty,
      qtyAcumulada: node.qtyAcumulada,
      hasProcess: node.hasProcess,
      process: node.process,
      symbol: node.hasProcess ? 'roundRect' : 'circle',
      symbolSize: node.hasProcess ? 10 : 8,
      itemStyle: {
        color: getLevelCss(level),
        borderColor: isSel ? '#4b9cff' : node.hasProcess ? '#333' : '#aaa',
        borderWidth: isSel ? 3 : node.hasProcess ? 2 : 1,
      },
      label: {
        color: '#111',
        formatter: (p: any) => {
          const d = p?.data ?? {};
          const code = d?.code ?? '';
          const estab = d?.estabelecimento;
          const displayCode = formatarCodigoComEstab(code, estab);
          const qty = d?.qtyAcumulada !== undefined ? d.qtyAcumulada : (d?.qty ?? '');
          const hasProcess = d?.hasProcess;
          const icon = hasProcess ? '⚙️ ' : '';
          return showQty ? `${icon}${displayCode} (${qty})` : `${icon}${displayCode}`;
        },
      },
      children: children.length > 0 ? children : undefined,
    };
  };

  return toTree(root, 0, []);
};

/**
 * Constrói dados para o Treemap
 */
export const buildTreemapData = (
  root: TreeNode,
  getLevelCss: (level: number) => string,
  selectedId?: string | null,
  showQty = true
) => {
  const toTreemap = (node: TreeNode, level: number, path: string[]): any => {
    const idPath = [...path, node.code].join('>');
    const kids = node.children.map((c) => toTreemap(c, level + 1, [...path, node.code]));
    const isSel = selectedId === idPath;
    const nodeQty = getQty(node);

    return {
      name: formatarCodigoComEstab(node.code, node.estabelecimento),
      code: node.code,
      estabelecimento: node.estabelecimento,
      idPath,
      qty: nodeQty,
      qtyAcumulada: node.qtyAcumulada,
      hasProcess: node.hasProcess,
      process: node.process,
      value: kids.length ? undefined : Math.max(1, nodeQty),
      children: kids.length ? kids : undefined,
      itemStyle: {
        color: getLevelCss(level),
        borderColor: isSel ? '#4b9cff' : node.hasProcess ? '#333' : '#fff',
        borderWidth: isSel ? 3 : node.hasProcess ? 2 : 1,
      },
      label: {
        show: true,
        color: '#111',
        formatter: (p: any) => {
          const d = p?.data ?? {};
          const code = d?.code ?? '';
          const estab = d?.estabelecimento;
          const displayCode = formatarCodigoComEstab(code, estab);
          const qty = d?.qtyAcumulada !== undefined ? d.qtyAcumulada : d?.qty;
          const qtyFormatted = typeof qty === 'number' ? qty.toFixed(7) : qty;
          return showQty ? `${displayCode} (qtd: ${qtyFormatted})` : displayCode;
        },
      },
      upperLabel: { show: true, color: '#111' },
    };
  };

  return toTreemap(root, 0, []);
};

/**
 * Constrói dados para o Grafo
 */
export const buildGraphData = (
  root: TreeNode,
  getLevelCss: (level: number) => string,
  selectedId?: string | null,
  showQty = true
) => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const nodeSizeByLevel = (level: number) => {
    const maxLevel = 7;
    const L = Math.min(level, maxLevel);
    const size0 = 72,
      sizeN = 12;
    const step = (size0 - sizeN) / maxLevel;
    return Math.round(size0 - step * L);
  };

  const walk = (node: TreeNode, level: number, path: string[]) => {
    const id = [...path, node.code].join('>');
    const isSel = selectedId === id;
    const nodeQty = getQty(node);

    nodes.push({
      id,
      name: formatarCodigoComEstab(node.code, node.estabelecimento),
      code: node.code,
      estabelecimento: node.estabelecimento,
      value: nodeQty,
      symbolSize: isSel ? nodeSizeByLevel(level) + 10 : nodeSizeByLevel(level),
      hasProcess: node.hasProcess,
      process: node.process,
      itemStyle: {
        color: getLevelCss(level),
        borderColor: isSel ? '#4b9cff' : node.hasProcess ? '#333' : '#aaa',
        borderWidth: isSel ? 3 : node.hasProcess ? 2 : 1,
      },
      label: {
        show: true,
        color: '#111',
        formatter: (p: any) => {
          const d = p?.data ?? {};
          const code = d?.code ?? d?.name ?? '';
          const estab = d?.estabelecimento;
          const displayCode = formatarCodigoComEstab(code, estab);
          return showQty ? `${displayCode} (${d.value ?? ''})` : displayCode;
        },
      },
    });

    for (const ch of node.children) {
      const cid = [...path, node.code, ch.code].join('>');
      const childQty = getQty(ch);
      links.push({
        source: id,
        target: cid,
        value: childQty,
        label: showQty
          ? {
              show: true,
              formatter: (p: any) => {
                const val = p.data?.value;
                const formatted = typeof val === 'number' ? val.toFixed(7) : val;
                return `qtd: ${formatted ?? ''}`;
              },
            }
          : { show: false },
      });
      walk(ch, level + 1, [...path, node.code]);
    }
  };

  walk(root, 0, []);
  return { nodes, links };
};
