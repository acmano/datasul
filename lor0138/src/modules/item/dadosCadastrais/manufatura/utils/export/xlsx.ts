// src/modules/item/dadosCadastrais/manufatura/utils/export/xlsx.ts

import * as XLSX from 'xlsx';
import { ItemManufatura } from '../../types';

const formatInteger = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return Math.floor(value).toString();
};

const formatDecimal = (value: number | null | undefined, decimals: number): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return value.toFixed(decimals);
};

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return value.toFixed(2) + '%';
};

export const exportManufaturaToXLSX = (
  manufatura: ItemManufatura,
  filename: string = 'item_manufatura'
) => {
  if (!manufatura) {
    alert('Não há dados para exportar');
    return;
  }

  const headers = [
    'Item',
    'Descrição',
    // Gerais
    'Situação',
    'Tipo Controle',
    'Tipo Controle Estoque',
    'Tipo Requisição',
    'Considera Alocação Atividades',
    'Programa Alocação Atividades',
    'Taxa Overlap (%)',
    // Reposição
    'Política',
    'Tipo Demanda',
    'Lote Múltiplo',
    'Lote Mínimo',
    'Lote Econômico',
    'Estoque Segurança Tipo',
    'Estoque Segurança Quantidade',
    'Estoque Segurança Tempo',
    'Converte Tempo',
    'Reabastecimento',
    'Período Fixo',
    'Ponto Reposição',
    'Fator Refugo (%)',
    'Quantidade Perda',
    // MRP
    'Classe Reprogramação',
    'Emissão Ordens',
    'Controle Planejamento',
    'Divisão Ordens',
    'Processo',
    'Represa Demanda',
    'Ressuprimento Compras',
    'Ressuprimento Fornecedor',
    'Ressuprimento Qualidade',
    'Ressuprimento Fábrica',
    'Ressuprimento Fábrica Qualidade',
    'Ressuprimento Mínimo',
    'Variação Tempo',
    'Ressuprimento Quantidade',
    'Horizonte Liberação',
    'Horizonte Fixo',
    // PV/MPS/CRP
    'PV Origem',
    'PV Fórmula',
    'MPS Critério Cálculo',
    'MPS Fator Custo Distribuição (%)',
    'CRP Prioridade',
    'CRP Programação',
  ];

  const values = [
    manufatura.item.codigo,
    manufatura.item.descricao,
    // Gerais
    manufatura.item.gerais.situacao || '',
    manufatura.item.gerais.tipoControle || '',
    manufatura.item.gerais.tipoControleEstoque || '',
    manufatura.item.gerais.tipoRequisicao || '',
    manufatura.item.gerais.consideraAlocacaoAtividades || '',
    manufatura.item.gerais.programaAlocacaoAtividades || '',
    formatPercent(manufatura.item.gerais.taxaOverlap),
    // Reposição
    manufatura.item.reposicao.politica || '',
    manufatura.item.reposicao.tipoDemanda || '',
    formatInteger(manufatura.item.reposicao.lote.multiplo),
    formatInteger(manufatura.item.reposicao.lote.minimo),
    formatInteger(manufatura.item.reposicao.lote.economico),
    manufatura.item.reposicao.estoqueSeguranca.tipo || '',
    formatInteger(manufatura.item.reposicao.estoqueSeguranca.quantidade),
    formatInteger(manufatura.item.reposicao.estoqueSeguranca.tempo),
    manufatura.item.reposicao.estoqueSeguranca.converteTempo || '',
    manufatura.item.reposicao.estoqueSeguranca.reabastecimento || '',
    formatInteger(manufatura.item.reposicao.periodoFixo),
    formatInteger(manufatura.item.reposicao.pontoReposicao),
    formatPercent(manufatura.item.reposicao.fatorRefugo),
    formatDecimal(manufatura.item.reposicao.quantidadePerda, 4),
    // MRP
    manufatura.item.mrp.classeReprogramacao || '',
    manufatura.item.mrp.emissaoOrdens || '',
    manufatura.item.mrp.controlePlanejamento || '',
    manufatura.item.mrp.divisaoOrdens || '',
    manufatura.item.mrp.processo || '',
    manufatura.item.mrp.represaDemanda || '',
    formatInteger(manufatura.item.mrp.ressuprimento.compras),
    formatInteger(manufatura.item.mrp.ressuprimento.fornecedor),
    formatInteger(manufatura.item.mrp.ressuprimento.qualidade),
    formatInteger(manufatura.item.mrp.ressuprimento.fabrica),
    formatInteger(manufatura.item.mrp.ressuprimento.fabricaQualidade),
    formatInteger(manufatura.item.mrp.ressuprimento.minimo),
    formatInteger(manufatura.item.mrp.ressuprimento.variacaoTempo),
    formatInteger(manufatura.item.mrp.ressuprimento.quantidade),
    formatInteger(manufatura.item.mrp.ressuprimento.horizonteLiberacao),
    formatInteger(manufatura.item.mrp.ressuprimento.horizonteFixo),
    // PV/MPS/CRP
    manufatura.item.pvMpsCrp.pV.origem || '',
    manufatura.item.pvMpsCrp.pV.formula || '',
    manufatura.item.pvMpsCrp.MPS.criterioCalculo || '',
    formatPercent(manufatura.item.pvMpsCrp.MPS.fatorCustoDistribuicao),
    formatInteger(manufatura.item.pvMpsCrp.CRP.prioridade),
    manufatura.item.pvMpsCrp.CRP.programacao || '',
  ];

  const data = [headers, values];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = Array(headers.length).fill({ wch: 20 });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Manufatura');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  XLSX.writeFile(wb, `${filename}_${manufatura.item.codigo}_${timestamp}.xlsx`);
};
