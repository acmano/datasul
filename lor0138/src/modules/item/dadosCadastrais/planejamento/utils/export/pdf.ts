// src/modules/item/dadosCadastrais/planejamento/utils/export/pdf.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ItemPlanejamento, EstabelecimentoPlanejamento } from '../../types';

export const exportPlanejamentoToPDF = (
  planejamento: ItemPlanejamento,
  estabelecimentoCodigo: string,
  filename: string = 'item_planejamento'
) => {
  if (!planejamento) {
    alert('Não há dados para exportar');
    return;
  }

  const estab = planejamento.item.estabelecimento.find(
    (e: EstabelecimentoPlanejamento) => e.codigo === estabelecimentoCodigo
  );
  if (!estab) {
    alert('Estabelecimento não encontrado');
    return;
  }

  const doc = new jsPDF();
  let startY = 15;

  // Título
  doc.setFontSize(16);
  doc.text('Planejamento do Item', 14, startY);
  startY += 10;

  // Subtítulo
  doc.setFontSize(12);
  doc.text(`Item: ${planejamento.item.codigo} - ${planejamento.item.descricao}`, 14, startY);
  startY += 5;
  doc.text(`Estabelecimento: ${estab.codigo} - ${estab.nome}`, 14, startY);
  startY += 5;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(14, startY, 196, startY);
  startY += 5;

  // Produção 1
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Produção 1', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Depósito Padrão', estab.producao1.depositoPadrao || '-'],
      ['Localização', estab.producao1.localizacao || '-'],
      ['Status', estab.producao1.status?.toString() || '-'],
      ['Planejador', `${estab.producao1.planejador.codigo} - ${estab.producao1.planejador.nome}`],
      [
        'Linha Produção',
        `${estab.producao1.linhaProducao.codigo || '-'} - ${estab.producao1.linhaProducao.nome}`,
      ],
      ['Capacidade Estoque', estab.producao1.chaoDeFabrica.capacidadeEstoque?.toString() || '-'],
      [
        'Considera Aloc. Atividades',
        estab.producao1.chaoDeFabrica.consideraAlocAtividades ? 'Sim' : 'Não',
      ],
      [
        'Programa Aloc. Atividades',
        estab.producao1.chaoDeFabrica.programaAlocAtividades ? 'Sim' : 'Não',
      ],
      ['Percentual Overlap', estab.producao1.chaoDeFabrica.percentualOverlap?.toString() || '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // Produção 2
  doc.setFont('helvetica', 'bold');
  doc.text('Produção 2', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Reporta MOB', estab.producao2.reportaMOB || '-'],
      ['Reporta GGF', estab.producao2.reportaGGF || '-'],
      ['Tipo Alocação', estab.producao2.tipoAlocacao || '-'],
      ['Tipo Requisição', estab.producao2.tipoRequisicao || '-'],
      ['Processo Custos', estab.producao2.processoCustos || '-'],
      ['Reporte Produção', estab.producao2.reporteProducao || '-'],
      ['Tratamento Refugo', estab.producao2.refugo.tratamentoRefugo || '-'],
      ['Controla Estoque', estab.producao2.refugo.controlaEstoque || '-'],
      ['Preço Fiscal', estab.producao2.refugo.precoFiscal || '-'],
      [
        'Item Refugo',
        `${estab.producao2.refugo.item.codigo} - ${estab.producao2.refugo.item.descricao}`,
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  // Nova página
  doc.addPage();
  startY = 15;

  // Reposição
  doc.setFont('helvetica', 'bold');
  doc.text('Reposição', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Política', estab.reposicao.politica || '-'],
      ['Tipo Demanda', estab.reposicao.tipoDemanda || '-'],
      ['Lote Múltiplo', estab.reposicao.lote.multiplo?.toString() || '-'],
      ['Lote Mínimo', estab.reposicao.lote.minimo?.toString() || '-'],
      ['Lote Econômico', estab.reposicao.lote.economico?.toString() || '-'],
      ['Período Fixo', estab.reposicao.lote.periodoFixo?.toString() || '-'],
      ['Ponto Reposição', estab.reposicao.lote.pontoReposicao?.toString() || '-'],
      ['Estoque Segurança - Tipo', estab.reposicao.estoqueSeguranca.tipo || '-'],
      ['Estoque Segurança - Valor', estab.reposicao.estoqueSeguranca.valor?.toString() || '-'],
      ['Converte Tempo', estab.reposicao.estoqueSeguranca.converteTempo || '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 14, right: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 10;

  // MRP
  doc.setFont('helvetica', 'bold');
  doc.text('MRP', 14, startY);
  startY += 5;

  autoTable(doc, {
    startY: startY,
    head: [['Campo', 'Valor']],
    body: [
      ['Classe Reprogramação', estab.mrp.classeReprogramacao || '-'],
      ['Emissão Ordens', estab.mrp.emissaoOrdens || '-'],
      ['Divisão Ordens', estab.mrp.divisaoOrdens || '-'],
      ['Prioridade', estab.mrp.prioridade?.toString() || '-'],
      [
        'Ressuprimento Compras - Qtd',
        estab.mrp.ressuprimento.compras.quantidade?.toString() || '-',
      ],
      [
        'Ressuprimento Compras - Fornecedor',
        estab.mrp.ressuprimento.compras.fornecedor?.toString() || '-',
      ],
      [
        'Ressuprimento Compras - Qualidade',
        estab.mrp.ressuprimento.compras.qualidade?.toString() || '-',
      ],
      [
        'Ressuprimento Fábrica - Qtd',
        estab.mrp.ressuprimento.fabrica.quantidade?.toString() || '-',
      ],
      [
        'Ressuprimento Fábrica - Qualidade',
        estab.mrp.ressuprimento.fabrica.qualidade?.toString() || '-',
      ],
      ['Ressuprimento Fábrica - Mínimo', estab.mrp.ressuprimento.fabrica.minimo?.toString() || '-'],
      [
        'Ressuprimento Fábrica - Var. Tempo',
        estab.mrp.ressuprimento.fabrica.variacao.tempo?.toString() || '-',
      ],
      [
        'Ressuprimento Fábrica - Var. Qtd',
        estab.mrp.ressuprimento.fabrica.variacao.quantidade?.toString() || '-',
      ],
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
  doc.save(`${filename}_${planejamento.item.codigo}_${estab.codigo}_${timestamp}.pdf`);
};
