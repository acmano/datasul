// src/modules/engenharia/estrutura/utils/export/pdf.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TreeNode } from '../../types/estrutura.types';

export const exportEstruturaToPDF = (
  tree: TreeNode | null,
  filename: string = 'estrutura_materiais'
) => {
  if (!tree) {
    alert('Não há dados para exportar');
    return;
  }

  const doc = new jsPDF();
  let startY = 15;

  // Título
  doc.setFontSize(16);
  doc.text('Estrutura (BOM)', 14, startY);
  startY += 10;

  // Subtítulo - Item Raiz
  doc.setFontSize(12);
  doc.text(`Item: ${tree.code} - ${tree.name}`, 14, startY);
  startY += 5;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(14, startY, 196, startY);
  startY += 10;

  // Coletar dados da estrutura
  const rows: any[][] = [];

  const walkTree = (node: TreeNode, level: number) => {
    const indent = '  '.repeat(level);
    const levelPrefix = level > 0 ? `${indent}└─ ` : '';

    rows.push([
      level.toString(),
      node.code,
      `${levelPrefix}${node.name}`,
      (node.qty || 1).toFixed(7),
      node.unidadeMedida || '',
      node.hasProcess ? 'Sim' : 'Não',
    ]);

    node.children.forEach((child) => {
      walkTree(child, level + 1);
    });
  };

  walkTree(tree, 0);

  // Criar tabela
  autoTable(doc, {
    startY: startY,
    head: [['Nível', 'Código', 'Descrição', 'Quantidade', 'Unidade', 'Processo']],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [66, 139, 202] as any,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 15 }, // Nível
      1: { cellWidth: 25 }, // Código
      2: { cellWidth: 70 }, // Descrição (mais largo para hierarquia)
      3: { cellWidth: 25 }, // Quantidade
      4: { cellWidth: 20 }, // Unidade
      5: { cellWidth: 20 }, // Processo
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data: any) => {
      // Aplicar fonte monospace na coluna Descrição para melhor visualização da hierarquia
      if (data.column.index === 2) {
        data.cell.styles.font = 'courier';
      }
    },
  });

  // Rodapé com numeração de páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const pageText = `Página ${i} de ${pageCount}`;
    doc.text(
      pageText,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Data/hora de geração
    const timestamp = new Date().toLocaleString('pt-BR');
    doc.text(`Gerado em: ${timestamp}`, 14, doc.internal.pageSize.getHeight() - 10);
  }

  const fileTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  doc.save(`${filename}_${tree.code}_${fileTimestamp}.pdf`);
};
