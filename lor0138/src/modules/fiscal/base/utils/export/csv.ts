// src/modules/fiscal/base/utils/export/csv.ts

import { ItemFiscal } from '../../types';

export const exportFiscalToCSV = (fiscal: ItemFiscal, filename: string = 'item_fiscal') => {
  if (!fiscal) {
    alert('Não há dados para exportar');
    return;
  }

  const headers = [
    'Item',
    'Descrição',
    // Gerais
    'Forma Descrição',
    'Forma Obtenção',
    'Quantidade Fracionada',
    'Lote Múltiplo',
    'Unidade Negócio Código',
    'Unidade Negócio Nome',
    'Origem Unid Trib',
    // Complementares
    'Tipo Controle',
    'Tipo Controle Estoque',
    'Emissão NF',
    'Faturável',
    'Baixa Estoque',
    // Fiscal
    'Serviço',
    'DCR',
    'SEFAZ SP',
    'Classificação Código',
    'Classificação NCM',
    'Classificação Nome',
    'IPI Código Tributação',
    'IPI Alíquota',
    'IPI Apuração',
    'IPI Suspenso',
    'IPI Diferenciado',
    'IPI Incentivado',
    'IPI Combustível/Solvente',
    'IPI Família Código',
    'IPI Família Nome',
    'ICMS Código Tributação',
    'ICMS Fator Reajuste',
    'ISS Código',
    'ISS Alíquota',
    'INSS Serviço Código',
    // PIS
    'PIS Cálculo Por Unidade',
    'PIS Valor Por Unidade',
    'PIS Alíquota Origem',
    'PIS Alíquota',
    'PIS Percentual Redução',
    'PIS Retenção Percentual',
    'PIS Retenção Origem',
    // COFINS
    'COFINS Cálculo Por Unidade',
    'COFINS Valor Por Unidade',
    'COFINS Alíquota Origem',
    'COFINS Alíquota',
    'COFINS Percentual Redução',
    'COFINS Retenção Percentual',
    'COFINS Retenção Origem',
    // CSLL
    'CSLL Retenção Origem',
    'CSLL Retenção Percentual',
    'Subst Total NF',
  ];

  const values = [
    fiscal.item.codigo,
    fiscal.item.descricao,
    // Gerais
    fiscal.item.gerais.formaDescricao || '',
    fiscal.item.gerais.formaObtencao || '',
    fiscal.item.gerais.quantidadeFracionada || '',
    fiscal.item.gerais.loteMultiplo || '',
    fiscal.item.gerais.unidadeNegocio.codigo || '',
    fiscal.item.gerais.unidadeNegocio.nome || '',
    fiscal.item.gerais.origemUnidTrib || '',
    // Complementares
    fiscal.item.complementares.tipoControle || '',
    fiscal.item.complementares.tipoControleEstoque || '',
    fiscal.item.complementares.emissaoNF || '',
    fiscal.item.complementares.faturavel || '',
    fiscal.item.complementares.baixaEstoque || '',
    // Fiscal
    fiscal.item.fiscal.servico || '',
    fiscal.item.fiscal.DCR || '',
    fiscal.item.fiscal.sefazSP || '',
    fiscal.item.fiscal.classificacao.codigo || '',
    fiscal.item.fiscal.classificacao.ncm || '',
    fiscal.item.fiscal.classificacao.nome || '',
    fiscal.item.fiscal.ipi.codigoTributacao || '',
    fiscal.item.fiscal.ipi.aliquota || '',
    fiscal.item.fiscal.ipi.apuracao || '',
    fiscal.item.fiscal.ipi.suspenso || '',
    fiscal.item.fiscal.ipi.diferenciado || '',
    fiscal.item.fiscal.ipi.incentivado || '',
    fiscal.item.fiscal.ipi.combustivelSolvente || '',
    fiscal.item.fiscal.ipi.familia.codigo || '',
    fiscal.item.fiscal.ipi.familia.nome || '',
    fiscal.item.fiscal.icms.codigoTributacao || '',
    fiscal.item.fiscal.icms.fatorReajuste || '',
    fiscal.item.fiscal.iss.codigo || '',
    fiscal.item.fiscal.iss.aliquota || '',
    fiscal.item.fiscal.inss.servicoCodigo || '',
    // PIS
    fiscal.item.pisCofins.pis.calculoPorUnidade || '',
    fiscal.item.pisCofins.pis.valorPorUnidade || '',
    fiscal.item.pisCofins.pis.aliquotaOrigem || '',
    fiscal.item.pisCofins.pis.aliquota || '',
    fiscal.item.pisCofins.pis.percentualReducao || '',
    fiscal.item.pisCofins.pis.retencao.percentual || '',
    fiscal.item.pisCofins.pis.retencao.origem || '',
    // COFINS
    fiscal.item.pisCofins.cofins.calculoPorUnidade || '',
    fiscal.item.pisCofins.cofins.valorPorUnidade || '',
    fiscal.item.pisCofins.cofins.aliquotaOrigem || '',
    fiscal.item.pisCofins.cofins.aliquota || '',
    fiscal.item.pisCofins.cofins.percentualReducao || '',
    fiscal.item.pisCofins.cofins.retencao.percentual || '',
    fiscal.item.pisCofins.cofins.retencao.origem || '',
    // CSLL
    fiscal.item.pisCofins.retencaoCsll.origem || '',
    fiscal.item.pisCofins.retencaoCsll.percentual || '',
    fiscal.item.pisCofins.substTotalNF || '',
  ];

  const csvRows = [headers.map((h) => `"${h}"`).join(';'), values.map((v) => `"${v}"`).join(';')];

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${fiscal.item.codigo}_${timestamp}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
