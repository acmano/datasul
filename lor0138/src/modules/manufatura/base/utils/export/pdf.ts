// src/modules/manufatura/base/utils/export/pdf.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ItemManufatura } from '../../types';

const formatInteger = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  return Math.floor(value).toString();
};

const formatDecimal = (value: number | null | undefined, decimals: number): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  return value.toFixed(decimals);
};

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  return value.toFixed(2) + '%';
};

export const exportManufaturaToPDF = (
  manufatura: ItemManufatura,
  filename: string = 'item_manufatura'
) => {
  if (!manufatura) {
    alert('Não há dados para exportar');
    return;
  }

  const doc = new jsPDF();
  let startY = 15;

  // Título
  doc.setFontSize(16);
  doc.text('Manufatura do Item', 14, startY);
  startY += 10;

  // Subtítulo
  doc.setFontSize(12);
  doc.text(`Item: ${manufatura.item.codigo} - ${manufatura.item.descricao}`, 14, startY);
  startY += 10;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(14, startY, 196, startY);
  startY += 5;

  // Gerais
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações Gerais', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Situação', manufatura.item.gerais.situacao || '-'],
      ['Tipo Controle', manufatura.item.gerais.tipoControle || '-'],
      ['Tipo Controle Estoque', manufatura.item.gerais.tipoControleEstoque || '-'],
      ['Tipo Requisição', manufatura.item.gerais.tipoRequisicao || '-'],
      ['Considera Alocação Atividades', manufatura.item.gerais.consideraAlocacaoAtividades || '-'],
      ['Programa Alocação Atividades', manufatura.item.gerais.programaAlocacaoAtividades || '-'],
      ['Taxa Overlap', formatPercent(manufatura.item.gerais.taxaOverlap)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // Reposição
  doc.setFont('helvetica', 'bold');
  doc.text('Reposição', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Política', manufatura.item.reposicao.politica || '-'],
      ['Tipo Demanda', manufatura.item.reposicao.tipoDemanda || '-'],
      ['Lote Múltiplo', formatInteger(manufatura.item.reposicao.lote.multiplo)],
      ['Lote Mínimo', formatInteger(manufatura.item.reposicao.lote.minimo)],
      ['Lote Econômico', formatInteger(manufatura.item.reposicao.lote.economico)],
      ['Estoque Segurança - Tipo', manufatura.item.reposicao.estoqueSeguranca.tipo || '-'],
      [
        'Estoque Segurança - Quantidade',
        formatInteger(manufatura.item.reposicao.estoqueSeguranca.quantidade),
      ],
      [
        'Estoque Segurança - Tempo',
        formatInteger(manufatura.item.reposicao.estoqueSeguranca.tempo),
      ],
      ['Converte Tempo', manufatura.item.reposicao.estoqueSeguranca.converteTempo || '-'],
      ['Reabastecimento', manufatura.item.reposicao.estoqueSeguranca.reabastecimento || '-'],
      ['Período Fixo', formatInteger(manufatura.item.reposicao.periodoFixo)],
      ['Ponto Reposição', formatInteger(manufatura.item.reposicao.pontoReposicao)],
      ['Fator Refugo', formatPercent(manufatura.item.reposicao.fatorRefugo)],
      ['Quantidade Perda', formatDecimal(manufatura.item.reposicao.quantidadePerda, 4)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  // Nova página
  doc.addPage();
  startY = 15;

  // MRP
  doc.setFont('helvetica', 'bold');
  doc.text('MRP', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Classe Reprogramação', manufatura.item.mrp.classeReprogramacao || '-'],
      ['Emissão Ordens', manufatura.item.mrp.emissaoOrdens || '-'],
      ['Controle Planejamento', manufatura.item.mrp.controlePlanejamento || '-'],
      ['Divisão Ordens', manufatura.item.mrp.divisaoOrdens || '-'],
      ['Processo', manufatura.item.mrp.processo || '-'],
      ['Represa Demanda', manufatura.item.mrp.represaDemanda || '-'],
      ['Ressuprimento - Compras', formatInteger(manufatura.item.mrp.ressuprimento.compras)],
      ['Ressuprimento - Fornecedor', formatInteger(manufatura.item.mrp.ressuprimento.fornecedor)],
      ['Ressuprimento - Qualidade', formatInteger(manufatura.item.mrp.ressuprimento.qualidade)],
      ['Ressuprimento - Fábrica', formatInteger(manufatura.item.mrp.ressuprimento.fabrica)],
      [
        'Ressuprimento - Fábrica Qualidade',
        formatInteger(manufatura.item.mrp.ressuprimento.fabricaQualidade),
      ],
      ['Ressuprimento - Mínimo', formatInteger(manufatura.item.mrp.ressuprimento.minimo)],
      ['Variação Tempo', formatInteger(manufatura.item.mrp.ressuprimento.variacaoTempo)],
      ['Ressuprimento - Quantidade', formatInteger(manufatura.item.mrp.ressuprimento.quantidade)],
      ['Horizonte Liberação', formatInteger(manufatura.item.mrp.ressuprimento.horizonteLiberacao)],
      ['Horizonte Fixo', formatInteger(manufatura.item.mrp.ressuprimento.horizonteFixo)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // PV/MPS/CRP
  doc.setFont('helvetica', 'bold');
  doc.text('PV/MPS/CRP', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['PV - Origem', manufatura.item.pvMpsCrp.pV.origem || '-'],
      ['PV - Fórmula', manufatura.item.pvMpsCrp.pV.formula || '-'],
      ['MPS - Critério Cálculo', manufatura.item.pvMpsCrp.MPS.criterioCalculo || '-'],
      [
        'MPS - Fator Custo Distribuição',
        formatPercent(manufatura.item.pvMpsCrp.MPS.fatorCustoDistribuicao),
      ],
      ['CRP - Prioridade', formatInteger(manufatura.item.pvMpsCrp.CRP.prioridade)],
      ['CRP - Programação', manufatura.item.pvMpsCrp.CRP.programacao || '-'],
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
  doc.save(`${filename}_${manufatura.item.codigo}_${timestamp}.pdf`);
};
