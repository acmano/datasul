import { TreeNodeOndeUsado } from '../../types/ondeUsado.types';

/**
 * Exporta Onde Usado para CSV - nome do arquivo já identifica corretamente
 */
export const exportOndeUsadoToCSV = (
  tree: TreeNodeOndeUsado | null,
  filename: string = 'onde_usado'
) => {
  if (!tree) {
    alert('Não há dados para exportar');
    return;
  }

  const headers = ['Nível', 'Código', 'Descrição', 'Quantidade', 'Unidade', 'Tem Processo'];
  const rows: string[][] = [];

  const walkTree = (node: TreeNodeOndeUsado, level: number) => {
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
      walkTree(child, level + 1);
    });
  };

  walkTree(tree, 0);

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
