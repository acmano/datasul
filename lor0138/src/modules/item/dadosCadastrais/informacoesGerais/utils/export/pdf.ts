// src/modules/item/dadosCadastrais/informacoesGerais/utils/export/pdf.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ItemSearchResultItem } from '../../../../search/types/search.types';

export const exportBaseToPDF = (item: ItemSearchResultItem, filename: string = 'item_base') => {
  if (!item) {
    alert('Não há dados para exportar');
    return;
  }

  const doc = new jsPDF();

  // Título
  doc.setFontSize(16);
  doc.text('Dados Base do Item', 14, 15);

  // Subtítulo
  doc.setFontSize(12);
  doc.text(`Item: ${item.itemCodigo} - ${item.itemDescricao}`, 14, 25);

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(14, 28, 196, 28);

  // Tabela de dados
  const tableData = [
    ['Código', item.itemCodigo],
    ['Descrição', item.itemDescricao],
    ['Unidade de Medida', item.unidadeMedidaCodigo || '-'],
    ['Unidade Descrição', item.unidadeMedidaDescricao || '-'],
    ['Família', item.familiaCodigo || '-'],
    ['Família Descrição', item.familiaDescricao || '-'],
    ['Família Comercial', item.familiaComercialCodigo || '-'],
    ['Fam. Comercial Descrição', item.familiaComercialDescricao || '-'],
    ['Grupo de Estoque', item.grupoEstoqueCodigo || '-'],
    ['Grupo Estoque Descrição', item.grupoEstoqueDescricao || '-'],
    ['GTIN', item.gtin || '-'],
  ];

  autoTable(doc, {
    startY: 32,
    head: [['Campo', 'Valor']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 120 },
    },
    margin: { left: 14, right: 14 },
  });

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  doc.save(`${filename}_${item.itemCodigo}_${timestamp}.pdf`);
};
