// src/modules/item/dadosCadastrais/dimensoes/utils/export/pdf.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ItemDimensoes } from '../../types';

export const exportDimensoesToPDF = (
  dimensoes: ItemDimensoes,
  filename: string = 'item_dimensoes'
) => {
  if (!dimensoes) {
    alert('Não há dados para exportar');
    return;
  }

  const doc = new jsPDF();
  let startY = 15;

  // Título
  doc.setFontSize(16);
  doc.text('Dimensões do Item', 14, startY);
  startY += 10;

  // Subtítulo
  doc.setFontSize(12);
  doc.text(`Item: ${dimensoes.itemCodigo} - ${dimensoes.itemDescricao}`, 14, startY);
  startY += 5;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(14, startY, 196, startY);
  startY += 5;

  // Peça
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Peça', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Medida', 'Valor']],
    body: [
      ['Altura', `${dimensoes.peca.altura.toFixed(4)} m`],
      ['Largura', `${dimensoes.peca.largura.toFixed(4)} m`],
      ['Profundidade', `${dimensoes.peca.profundidade.toFixed(4)} m`],
      ['Peso', `${dimensoes.peca.peso.toFixed(4)} kg`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // Item
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Tipo', 'Altura (m)', 'Largura (m)', 'Prof. (m)', 'Peso (kg)']],
    body: [
      [
        'Embalagem',
        dimensoes.item.embalagem.altura.toFixed(4),
        dimensoes.item.embalagem.largura.toFixed(4),
        dimensoes.item.embalagem.profundidade.toFixed(4),
        dimensoes.item.embalagem.peso.toFixed(4),
      ],
      [
        'Embalado',
        dimensoes.item.embalado.altura.toFixed(4),
        dimensoes.item.embalado.largura.toFixed(4),
        dimensoes.item.embalado.profundidade.toFixed(4),
        dimensoes.item.embalado.peso.toFixed(4),
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Peças por Item: ${dimensoes.item.pecas}`, 14, startY);
  startY += 10;

  // Produto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Produto', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Tipo', 'Altura (m)', 'Largura (m)', 'Prof. (m)', 'Peso (kg)']],
    body: [
      [
        'Embalagem',
        dimensoes.produto.embalagem.altura.toFixed(4),
        dimensoes.produto.embalagem.largura.toFixed(4),
        dimensoes.produto.embalagem.profundidade.toFixed(4),
        dimensoes.produto.embalagem.peso.toFixed(4),
      ],
      [
        'Embalado',
        dimensoes.produto.embalado.altura.toFixed(4),
        dimensoes.produto.embalado.largura.toFixed(4),
        dimensoes.produto.embalado.profundidade.toFixed(4),
        dimensoes.produto.embalado.peso.toFixed(4),
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Itens por Produto: ${dimensoes.produto.itens} | GTIN-13: ${dimensoes.produto.gtin13 || '-'}`,
    14,
    startY
  );
  startY += 10;

  // Caixa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Caixa (Embalagem)', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Medida', 'Valor']],
    body: [
      ['Altura', `${dimensoes.caixa.embalagem.altura.toFixed(4)} m`],
      ['Largura', `${dimensoes.caixa.embalagem.largura.toFixed(4)} m`],
      ['Profundidade', `${dimensoes.caixa.embalagem.profundidade.toFixed(4)} m`],
      ['Peso', `${dimensoes.caixa.embalagem.peso.toFixed(4)} kg`],
      ['Produtos por Caixa', dimensoes.caixa.produtos.toString()],
      ['Sigla', dimensoes.caixa.embalagem.sigla || '-'],
      ['GTIN-14', dimensoes.caixa.gtin14 ? String(dimensoes.caixa.gtin14) : '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // Palete
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Palete', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Medida', 'Valor']],
    body: [
      ['Lastro', dimensoes.palete.lastro.toString()],
      ['Camadas', dimensoes.palete.camadas.toString()],
      ['Caixas por Palete', dimensoes.palete.caixasPalete.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
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
  doc.save(`${filename}_${dimensoes.itemCodigo}_${timestamp}.pdf`);
};
