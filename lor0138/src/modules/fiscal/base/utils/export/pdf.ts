// src/modules/fiscal/base/utils/export/pdf.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ItemFiscal } from '../../types';

export const exportFiscalToPDF = (fiscal: ItemFiscal, filename: string = 'item_fiscal') => {
  if (!fiscal) {
    alert('Não há dados para exportar');
    return;
  }

  const doc = new jsPDF();
  let startY = 15;

  // Título
  doc.setFontSize(16);
  doc.text('Dados Fiscais do Item', 14, startY);
  startY += 10;

  // Subtítulo
  doc.setFontSize(12);
  doc.text(`Item: ${fiscal.item.codigo} - ${fiscal.item.descricao}`, 14, startY);
  startY += 5;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(14, startY, 196, startY);
  startY += 5;

  // Informações Gerais
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações Gerais', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Forma Descrição', fiscal.item.gerais.formaDescricao || '-'],
      ['Forma Obtenção', fiscal.item.gerais.formaObtencao || '-'],
      ['Quantidade Fracionada', fiscal.item.gerais.quantidadeFracionada || '-'],
      ['Lote Múltiplo', fiscal.item.gerais.loteMultiplo || '-'],
      [
        'Unidade Negócio',
        `${fiscal.item.gerais.unidadeNegocio.codigo} - ${fiscal.item.gerais.unidadeNegocio.nome}`,
      ],
      ['Origem Unid. Trib', fiscal.item.gerais.origemUnidTrib || '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // Informações Complementares
  doc.setFont('helvetica', 'bold');
  doc.text('Informações Complementares', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Tipo Controle', fiscal.item.complementares.tipoControle || '-'],
      ['Tipo Controle Estoque', fiscal.item.complementares.tipoControleEstoque || '-'],
      ['Emissão NF', fiscal.item.complementares.emissaoNF || '-'],
      ['Faturável', fiscal.item.complementares.faturavel || '-'],
      ['Baixa Estoque', fiscal.item.complementares.baixaEstoque || '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // Informações Fiscais
  doc.setFont('helvetica', 'bold');
  doc.text('Informações Fiscais', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Serviço', fiscal.item.fiscal.servico || '-'],
      ['DCR', fiscal.item.fiscal.DCR || '-'],
      ['SEFAZ SP', fiscal.item.fiscal.sefazSP || '-'],
      [
        'Classificação',
        `${fiscal.item.fiscal.classificacao.codigo} - ${fiscal.item.fiscal.classificacao.nome}`,
      ],
      ['NCM', fiscal.item.fiscal.classificacao.ncm || '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  // Nova página
  doc.addPage();
  startY = 15;

  // IPI
  doc.setFont('helvetica', 'bold');
  doc.text('IPI', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Código Tributação', fiscal.item.fiscal.ipi.codigoTributacao || '-'],
      ['Alíquota', fiscal.item.fiscal.ipi.aliquota || '-'],
      ['Apuração', fiscal.item.fiscal.ipi.apuracao || '-'],
      ['Suspenso', fiscal.item.fiscal.ipi.suspenso || '-'],
      ['Diferenciado', fiscal.item.fiscal.ipi.diferenciado || '-'],
      ['Incentivado', fiscal.item.fiscal.ipi.incentivado || '-'],
      ['Combustível/Solvente', fiscal.item.fiscal.ipi.combustivelSolvente || '-'],
      [
        'Família',
        `${fiscal.item.fiscal.ipi.familia.codigo} - ${fiscal.item.fiscal.ipi.familia.nome}`,
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // ICMS
  doc.setFont('helvetica', 'bold');
  doc.text('ICMS', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Código Tributação', fiscal.item.fiscal.icms.codigoTributacao || '-'],
      ['Fator Reajuste', fiscal.item.fiscal.icms.fatorReajuste || '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // ISS
  doc.setFont('helvetica', 'bold');
  doc.text('ISS', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Código', fiscal.item.fiscal.iss.codigo || '-'],
      ['Alíquota', fiscal.item.fiscal.iss.aliquota || '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // INSS
  doc.setFont('helvetica', 'bold');
  doc.text('INSS', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [['Serviço Código', fiscal.item.fiscal.inss.servicoCodigo || '-']],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  // Nova página para PIS/COFINS
  doc.addPage();
  startY = 15;

  // PIS
  doc.setFont('helvetica', 'bold');
  doc.text('PIS', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Cálculo Por Unidade', fiscal.item.pisCofins.pis.calculoPorUnidade || '-'],
      ['Valor Por Unidade', fiscal.item.pisCofins.pis.valorPorUnidade || '-'],
      ['Alíquota Origem', fiscal.item.pisCofins.pis.aliquotaOrigem || '-'],
      ['Alíquota', fiscal.item.pisCofins.pis.aliquota || '-'],
      ['Percentual Redução', fiscal.item.pisCofins.pis.percentualReducao || '-'],
      ['Retenção - Percentual', fiscal.item.pisCofins.pis.retencao.percentual || '-'],
      ['Retenção - Origem', fiscal.item.pisCofins.pis.retencao.origem || '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // COFINS
  doc.setFont('helvetica', 'bold');
  doc.text('COFINS', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Cálculo Por Unidade', fiscal.item.pisCofins.cofins.calculoPorUnidade || '-'],
      ['Valor Por Unidade', fiscal.item.pisCofins.cofins.valorPorUnidade || '-'],
      ['Alíquota Origem', fiscal.item.pisCofins.cofins.aliquotaOrigem || '-'],
      ['Alíquota', fiscal.item.pisCofins.cofins.aliquota || '-'],
      ['Percentual Redução', fiscal.item.pisCofins.cofins.percentualReducao || '-'],
      ['Retenção - Percentual', fiscal.item.pisCofins.cofins.retencao.percentual || '-'],
      ['Retenção - Origem', fiscal.item.pisCofins.cofins.retencao.origem || '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // CSLL
  doc.setFont('helvetica', 'bold');
  doc.text('CSLL', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Retenção - Origem', fiscal.item.pisCofins.retencaoCsll.origem || '-'],
      ['Retenção - Percentual', fiscal.item.pisCofins.retencaoCsll.percentual || '-'],
      ['Subst. Total NF', fiscal.item.pisCofins.substTotalNF || '-'],
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
  doc.save(`${filename}_${fiscal.item.codigo}_${timestamp}.pdf`);
};
