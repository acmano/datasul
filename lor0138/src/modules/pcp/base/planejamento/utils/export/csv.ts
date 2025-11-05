// src/modules/pcp/base/planejamento/utils/export/csv.ts

import { ItemPlanejamento, EstabelecimentoPlanejamento } from '../../types';

export const exportPlanejamentoToCSV = (
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

  const headers = [
    'Item',
    'Descrição',
    'Estabelecimento',
    // Produção 1
    'Depósito Padrão',
    'Localização',
    'Status',
    'Planejador Código',
    'Planejador Nome',
    'Linha Produção Código',
    'Linha Produção Nome',
    'Capacidade Estoque',
    'Considera Aloc Atividades',
    'Programa Aloc Atividades',
    'Percentual Overlap',
    // Produção 2
    'Reporta MOB',
    'Reporta GGF',
    'Tipo Alocação',
    'Tipo Requisição',
    'Processo Custos',
    'Reporte Produção',
    'Tratamento Refugo',
    'Controla Estoque',
    'Preço Fiscal',
    'Refugo Item Código',
    'Refugo Item Descrição',
    'Refugo Relação Item',
    'Refugo Fator',
    'Refugo Perda',
    // Reposição
    'Política',
    'Tipo Demanda',
    'Lote Múltiplo',
    'Lote Mínimo',
    'Lote Econômico',
    'Período Fixo',
    'Ponto Reposição',
    'Estoque Segurança Tipo',
    'Estoque Segurança Valor',
    'Converte Tempo',
    // MRP
    'Classe Reprogramação',
    'Emissão Ordens',
    'Divisão Ordens',
    'Prioridade',
    'Ressuprimento Compras Qtd',
    'Ressuprimento Compras Fornecedor',
    'Ressuprimento Compras Qualidade',
    'Ressuprimento Fábrica Qtd',
    'Ressuprimento Fábrica Qualidade',
    'Ressuprimento Fábrica Mínimo',
    'Ressuprimento Fábrica Var Tempo',
    'Ressuprimento Fábrica Var Qtd',
  ];

  const values = [
    planejamento.item.codigo,
    planejamento.item.descricao,
    `${estab.codigo} - ${estab.nome}`,
    // Produção 1
    estab.producao1.depositoPadrao || '',
    estab.producao1.localizacao || '',
    estab.producao1.status?.toString() || '',
    estab.producao1.planejador.codigo || '',
    estab.producao1.planejador.nome || '',
    estab.producao1.linhaProducao.codigo?.toString() || '',
    estab.producao1.linhaProducao.nome || '',
    estab.producao1.chaoDeFabrica.capacidadeEstoque?.toString() || '',
    estab.producao1.chaoDeFabrica.consideraAlocAtividades ? 'Sim' : 'Não',
    estab.producao1.chaoDeFabrica.programaAlocAtividades ? 'Sim' : 'Não',
    estab.producao1.chaoDeFabrica.percentualOverlap?.toString() || '',
    // Produção 2
    estab.producao2.reportaMOB || '',
    estab.producao2.reportaGGF || '',
    estab.producao2.tipoAlocacao || '',
    estab.producao2.tipoRequisicao || '',
    estab.producao2.processoCustos || '',
    estab.producao2.reporteProducao || '',
    estab.producao2.refugo.tratamentoRefugo || '',
    estab.producao2.refugo.controlaEstoque || '',
    estab.producao2.refugo.precoFiscal || '',
    estab.producao2.refugo.item.codigo || '',
    estab.producao2.refugo.item.descricao || '',
    estab.producao2.refugo.relacaoItem?.toString() || '',
    estab.producao2.refugo.fator?.toString() || '',
    estab.producao2.refugo.perda?.toString() || '',
    // Reposição
    estab.reposicao.politica || '',
    estab.reposicao.tipoDemanda || '',
    estab.reposicao.lote.multiplo?.toString() || '',
    estab.reposicao.lote.minimo?.toString() || '',
    estab.reposicao.lote.economico?.toString() || '',
    estab.reposicao.lote.periodoFixo?.toString() || '',
    estab.reposicao.lote.pontoReposicao?.toString() || '',
    estab.reposicao.estoqueSeguranca.tipo || '',
    estab.reposicao.estoqueSeguranca.valor?.toString() || '',
    estab.reposicao.estoqueSeguranca.converteTempo || '',
    // MRP
    estab.mrp.classeReprogramacao || '',
    estab.mrp.emissaoOrdens || '',
    estab.mrp.divisaoOrdens || '',
    estab.mrp.prioridade?.toString() || '',
    estab.mrp.ressuprimento.compras.quantidade?.toString() || '',
    estab.mrp.ressuprimento.compras.fornecedor?.toString() || '',
    estab.mrp.ressuprimento.compras.qualidade?.toString() || '',
    estab.mrp.ressuprimento.fabrica.quantidade?.toString() || '',
    estab.mrp.ressuprimento.fabrica.qualidade?.toString() || '',
    estab.mrp.ressuprimento.fabrica.minimo?.toString() || '',
    estab.mrp.ressuprimento.fabrica.variacao.tempo?.toString() || '',
    estab.mrp.ressuprimento.fabrica.variacao.quantidade?.toString() || '',
  ];

  const csvRows = [headers.map((h) => `"${h}"`).join(';'), values.map((v) => `"${v}"`).join(';')];

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${filename}_${planejamento.item.codigo}_${estab.codigo}_${timestamp}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
