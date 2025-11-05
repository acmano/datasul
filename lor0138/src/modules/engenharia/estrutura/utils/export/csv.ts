// src/modules/engenharia/estrutura/utils/export/csv.ts

import { TreeNode } from '../../types/estrutura.types';

export const exportEstruturaToCSV = (
  tree: TreeNode | null,
  filename: string = 'estrutura_materiais'
) => {
  if (!tree) {
    alert('Não há dados para exportar');
    return;
  }

  const headers = ['Nível', 'Código', 'Descrição', 'Quantidade', 'Unidade', 'Tem Processo'];
  const rows: string[][] = [];

  // Função recursiva para percorrer a árvore
  const walkTree = (node: TreeNode, level: number, prefix: string = '') => {
    const indent = '  '.repeat(level);
    const levelPrefix = level > 0 ? `${indent}└─ ` : '';

    rows.push([
      String(level),
      node.code,
      `${levelPrefix}${node.name}`,
      String(node.qty || 1),
      node.unidadeMedida || '',
      node.hasProcess ? 'Sim' : 'Não',
    ]);

    node.children.forEach((child) => {
      walkTree(child, level + 1, prefix);
    });
  };

  walkTree(tree, 0);

  // Criar CSV
  const csvRows = [
    headers.map((h) => `"${h}"`).join(';'),
    ...rows.map((row) => row.map((v) => `"${v}"`).join(';')),
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${tree.code}_${timestamp}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
