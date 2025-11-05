import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ItemSearchResultItem } from '../../types/search.types';

export const exportSearchToPDF = (
  data: ItemSearchResultItem[],
  filename: string = 'pesquisa_itens'
) => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('Pesquisa de Itens - Resultados', 14, 15);

  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);
  doc.text(`Total: ${data.length} item(ns)`, 14, 28);

  const tableData = data.map((item) => [
    item.itemCodigo,
    item.itemDescricao,
    item.unidadeMedidaCodigo || '',
    item.familiaCodigo || '',
    item.familiaComercialCodigo || '',
    item.grupoEstoqueCodigo || '',
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['Código', 'Descrição', 'Unid.', 'Família', 'Fam. Com.', 'Grupo']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [24, 144, 255] },
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  doc.save(`${filename}_${timestamp}.pdf`);
};
