import * as XLSX from 'xlsx';
import { TreeNodeOndeUsado } from '../../types/ondeUsado.types';

/**
 * Exporta Onde Usado para XLSX com planilha nomeada corretamente
 */
export const exportOndeUsadoToXLSX = (
  tree: TreeNodeOndeUsado | null,
  filename: string = 'onde_usado'
) => {
  if (!tree) {
    alert('Não há dados para exportar');
    return;
  }

  const headers = ['Nível', 'Código', 'Descrição', 'Quantidade', 'Unidade', 'Tem Processo'];
  const rows: any[][] = [headers];

  const walkTree = (node: TreeNodeOndeUsado, level: number) => {
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

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 8 }, // Nível
    { wch: 15 }, // Código
    { wch: 50 }, // Descrição
    { wch: 12 }, // Quantidade
    { wch: 10 }, // Unidade
    { wch: 15 }, // Tem Processo
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Onde Usado');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  XLSX.writeFile(wb, `${filename}_${tree.code}_${timestamp}.xlsx`);
};
