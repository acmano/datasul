// src/modules/item/dadosCadastrais/planejamento/utils/export/xlsx.ts

import * as XLSX from 'xlsx';
import { ItemPlanejamento, EstabelecimentoPlanejamento } from '../../types';

export const exportPlanejamentoToXLSX = (
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
    estab.producao1.depositoPadrao || '',
    estab.producao1.localizacao || '',
    estab.producao1.status?.toString() || '',
    estab.producao1.planejador.codigo || '',
    estab.producao1.planejador.nome || '',
    estab.producao1.linhaProducao.codigo || '',
    estab.producao1.linhaProducao.nome || '',
    estab.producao1.chaoDeFabrica.capacidadeEstoque || '',
    estab.producao1.chaoDeFabrica.consideraAlocAtividades ? 'Sim' : 'Não',
    estab.producao1.chaoDeFabrica.programaAlocAtividades ? 'Sim' : 'Não',
    estab.producao1.chaoDeFabrica.percentualOverlap || '',
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
    estab.producao2.refugo.relacaoItem || '',
    estab.producao2.refugo.fator || '',
    estab.producao2.refugo.perda || '',
    estab.reposicao.politica || '',
    estab.reposicao.tipoDemanda || '',
    estab.reposicao.lote.multiplo || '',
    estab.reposicao.lote.minimo || '',
    estab.reposicao.lote.economico || '',
    estab.reposicao.lote.periodoFixo || '',
    estab.reposicao.lote.pontoReposicao || '',
    estab.reposicao.estoqueSeguranca.tipo || '',
    estab.reposicao.estoqueSeguranca.valor || '',
    estab.reposicao.estoqueSeguranca.converteTempo || '',
    estab.mrp.classeReprogramacao || '',
    estab.mrp.emissaoOrdens || '',
    estab.mrp.divisaoOrdens || '',
    estab.mrp.prioridade || '',
    estab.mrp.ressuprimento.compras.quantidade || '',
    estab.mrp.ressuprimento.compras.fornecedor || '',
    estab.mrp.ressuprimento.compras.qualidade || '',
    estab.mrp.ressuprimento.fabrica.quantidade || '',
    estab.mrp.ressuprimento.fabrica.qualidade || '',
    estab.mrp.ressuprimento.fabrica.minimo || '',
    estab.mrp.ressuprimento.fabrica.variacao.tempo || '',
    estab.mrp.ressuprimento.fabrica.variacao.quantidade || '',
  ];

  const data = [headers, values];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = Array(50).fill({ wch: 20 });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Planejamento');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  XLSX.writeFile(wb, `${filename}_${planejamento.item.codigo}_${estab.codigo}_${timestamp}.xlsx`);
};
