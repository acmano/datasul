// src/modules/engenharia/estrutura/utils/export/xlsx.ts

import * as XLSX from 'xlsx';
import { TreeNode } from '../../types/estrutura.types';

export const exportEstruturaToXLSX = (
  tree: TreeNode | null,
  filename: string = 'estrutura_materiais'
) => {
  if (!tree) {
    alert('Não há dados para exportar');
    return;
  }

  const headers = ['Nível', 'Código', 'Descrição', 'Quantidade', 'Unidade', 'Tem Processo'];
  const rows: any[][] = [headers];

  // Função recursiva para percorrer a árvore
  const walkTree = (node: TreeNode, level: number) => {
    const indent = '  '.repeat(level);
    const levelPrefix = level > 0 ? `${indent}└─ ` : '';

    rows.push([
      level,
      node.code,
      `${levelPrefix}${node.name}`,
      node.qty || 1,
      node.unidadeMedida || '',
      node.hasProcess ? 'Sim' : 'Não',
    ]);

    node.children.forEach((child) => {
      walkTree(child, level + 1);
    });
  };

  walkTree(tree, 0);

  // Criar workbook
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Ajustar largura das colunas
  ws['!cols'] = [
    { wch: 8 }, // Nível
    { wch: 15 }, // Código
    { wch: 50 }, // Descrição (mais largo para hierarquia)
    { wch: 12 }, // Quantidade
    { wch: 10 }, // Unidade
    { wch: 15 }, // Tem Processo
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estrutura');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  XLSX.writeFile(wb, `${filename}_${tree.code}_${timestamp}.xlsx`);
};
