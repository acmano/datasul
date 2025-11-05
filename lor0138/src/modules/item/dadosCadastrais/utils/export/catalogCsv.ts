import { CompleteItemData } from '../../services/catalogExport.service';

/**
 * Escapes a value for CSV format
 * Handles null/undefined, and escapes special characters
 */
const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Exports catalog data to CSV file with ALL item attributes from ALL tabs
 * @param data - Array of complete item data including all tabs
 * @param filename - Base filename for the export (default: 'catalogo_itens')
 */
export const exportCatalogToCSV = (
  data: CompleteItemData[],
  filename: string = 'catalogo_itens'
) => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Define CSV header with ALL columns from ALL tabs
  const headers = [
    // ===================================================================
    // FROM ITEM SEARCH (ItemSearchResultItem) - 11 fields
    // ===================================================================
    'Código Item',
    'Descrição Item',
    'Código Unidade Medida',
    'Descrição Unidade Medida',
    'Código Família',
    'Descrição Família',
    'Código Família Comercial',
    'Descrição Família Comercial',
    'Código Grupo Estoque',
    'Descrição Grupo Estoque',
    'GTIN',

    // ===================================================================
    // FROM INFORMAÇÕES GERAIS (ItemInformacoesGeraisFlat) - 14 additional fields
    // ===================================================================
    'Descrição Resumida',
    'Descrição Alternativa',
    'Narrativa Item',
    'Status Item',
    'Data Implantação',
    'Data Liberação',
    'Data Obsolescência',
    'Depósito',
    'Código Localização',
    'Endereço',
    'Estabelecimento Padrão Código',
    'Código Contenedor',
    'Descrição Contenedor',
    'Estabelecimentos (Lista)',

    // ===================================================================
    // FROM DIMENSÕES (ItemDimensoes) - 45 fields
    // ===================================================================
    // Peça (4 campos)
    'Peça - Altura',
    'Peça - Largura',
    'Peça - Profundidade',
    'Peça - Peso',

    // Item (9 campos)
    'Item - Número de Peças',
    'Item Embalagem - Altura',
    'Item Embalagem - Largura',
    'Item Embalagem - Profundidade',
    'Item Embalagem - Peso',
    'Item Embalado - Altura',
    'Item Embalado - Largura',
    'Item Embalado - Profundidade',
    'Item Embalado - Peso',

    // Produto (11 campos)
    'Produto - Número de Itens',
    'Produto - GTIN13',
    'Produto Embalagem - Altura',
    'Produto Embalagem - Largura',
    'Produto Embalagem - Profundidade',
    'Produto Embalagem - Peso',
    'Produto Embalado - Altura',
    'Produto Embalado - Largura',
    'Produto Embalado - Profundidade',
    'Produto Embalado - Peso',

    // Caixa (8 campos)
    'Caixa - Número de Produtos',
    'Caixa - GTIN14',
    'Caixa Embalagem - Sigla',
    'Caixa Embalagem - Altura',
    'Caixa Embalagem - Largura',
    'Caixa Embalagem - Profundidade',
    'Caixa Embalagem - Peso',

    // Palete (3 campos)
    'Palete - Lastro',
    'Palete - Camadas',
    'Palete - Caixas por Palete',

    // ===================================================================
    // FROM PLANEJAMENTO (EstabelecimentoPlanejamento) - 60+ fields
    // Usando o primeiro estabelecimento [0] quando houver múltiplos
    // ===================================================================
    'Planejamento - Código Estabelecimento',
    'Planejamento - Nome Estabelecimento',

    // Produção 1 (10 campos)
    'Prod1 - Depósito Padrão',
    'Prod1 - Localização',
    'Prod1 - Status',
    'Prod1 Planejador - Código',
    'Prod1 Planejador - Nome',
    'Prod1 Linha Produção - Código',
    'Prod1 Linha Produção - Nome',
    'Prod1 Chão Fábrica - Capacidade Estoque',
    'Prod1 Chão Fábrica - Considera Aloc Atividades',
    'Prod1 Chão Fábrica - Programa Aloc Atividades',
    'Prod1 Chão Fábrica - Percentual Overlap',

    // Produção 2 (15 campos)
    'Prod2 - Reporta MOB',
    'Prod2 - Reporta GGF',
    'Prod2 - Tipo Alocação',
    'Prod2 - Tipo Requisição',
    'Prod2 - Processo Custos',
    'Prod2 - Reporte Produção',
    'Prod2 Refugo - Tratamento',
    'Prod2 Refugo - Controla Estoque',
    'Prod2 Refugo - Preço Fiscal',
    'Prod2 Refugo Item - Código',
    'Prod2 Refugo Item - Descrição',
    'Prod2 Refugo - Relação Item',
    'Prod2 Refugo - Fator',
    'Prod2 Refugo - Perda',

    // Reposição (10 campos)
    'Reposição - Política',
    'Reposição - Tipo Demanda',
    'Reposição Lote - Múltiplo',
    'Reposição Lote - Mínimo',
    'Reposição Lote - Econômico',
    'Reposição Lote - Período Fixo',
    'Reposição Lote - Ponto Reposição',
    'Reposição Est Segurança - Tipo',
    'Reposição Est Segurança - Valor',
    'Reposição Est Segurança - Converte Tempo',

    // MRP (14 campos)
    'MRP - Classe Reprogramação',
    'MRP - Emissão Ordens',
    'MRP - Divisão Ordens',
    'MRP - Prioridade',
    'MRP Ressup Compras - Quantidade',
    'MRP Ressup Compras - Fornecedor',
    'MRP Ressup Compras - Qualidade',
    'MRP Ressup Fábrica - Quantidade',
    'MRP Ressup Fábrica - Qualidade',
    'MRP Ressup Fábrica - Mínimo',
    'MRP Ressup Fábrica Variação - Tempo',
    'MRP Ressup Fábrica Variação - Quantidade',

    // ===================================================================
    // FROM MANUFATURA (ItemManufatura) - 50+ fields
    // ===================================================================
    // Gerais (7 campos)
    'Manuf Gerais - Situação',
    'Manuf Gerais - Tipo Controle',
    'Manuf Gerais - Tipo Controle Estoque',
    'Manuf Gerais - Tipo Requisição',
    'Manuf Gerais - Considera Alocação Atividades',
    'Manuf Gerais - Programa Alocação Atividades',
    'Manuf Gerais - Taxa Overlap',

    // Reposição (13 campos)
    'Manuf Reposição - Política',
    'Manuf Reposição - Tipo Demanda',
    'Manuf Reposição Lote - Múltiplo',
    'Manuf Reposição Lote - Mínimo',
    'Manuf Reposição Lote - Econômico',
    'Manuf Reposição Est Seg - Tipo',
    'Manuf Reposição Est Seg - Quantidade',
    'Manuf Reposição Est Seg - Tempo',
    'Manuf Reposição Est Seg - Converte Tempo',
    'Manuf Reposição Est Seg - Reabastecimento',
    'Manuf Reposição - Período Fixo',
    'Manuf Reposição - Ponto Reposição',
    'Manuf Reposição - Fator Refugo',
    'Manuf Reposição - Quantidade Perda',

    // MRP (17 campos)
    'Manuf MRP - Classe Reprogramação',
    'Manuf MRP - Emissão Ordens',
    'Manuf MRP - Controle Planejamento',
    'Manuf MRP - Divisão Ordens',
    'Manuf MRP - Processo',
    'Manuf MRP - Represa Demanda',
    'Manuf MRP Ressup - Compras',
    'Manuf MRP Ressup - Fornecedor',
    'Manuf MRP Ressup - Qualidade',
    'Manuf MRP Ressup - Fábrica',
    'Manuf MRP Ressup - Fábrica Qualidade',
    'Manuf MRP Ressup - Mínimo',
    'Manuf MRP Ressup - Variação Tempo',
    'Manuf MRP Ressup - Quantidade',
    'Manuf MRP Ressup - Horizonte Liberação',
    'Manuf MRP Ressup - Horizonte Fixo',

    // PV/MPS/CRP (7 campos)
    'Manuf PV - Origem',
    'Manuf PV - Fórmula',
    'Manuf MPS - Critério Cálculo',
    'Manuf MPS - Fator Custo Distribuição',
    'Manuf CRP - Prioridade',
    'Manuf CRP - Programação',

    // ===================================================================
    // FROM FISCAL (ItemFiscal) - 60+ fields
    // ===================================================================
    // Gerais (6 campos)
    'Fiscal Gerais - Forma Descrição',
    'Fiscal Gerais - Forma Obtenção',
    'Fiscal Gerais - Quantidade Fracionada',
    'Fiscal Gerais - Lote Múltiplo',
    'Fiscal Gerais Unidade Negócio - Código',
    'Fiscal Gerais Unidade Negócio - Nome',
    'Fiscal Gerais - Origem Unid Trib',

    // Complementares (5 campos)
    'Fiscal Compl - Tipo Controle',
    'Fiscal Compl - Tipo Controle Estoque',
    'Fiscal Compl - Emissão NF',
    'Fiscal Compl - Faturável',
    'Fiscal Compl - Baixa Estoque',

    // Fiscal (13 campos)
    'Fiscal - Serviço',
    'Fiscal Classificação - Código',
    'Fiscal Classificação - NCM',
    'Fiscal Classificação - Nome',
    'Fiscal IPI - Código Tributação',
    'Fiscal IPI - Alíquota',
    'Fiscal IPI - Apuração',
    'Fiscal IPI - Suspenso',
    'Fiscal IPI - Diferenciado',
    'Fiscal IPI - Incentivado',
    'Fiscal IPI - Combustível/Solvente',
    'Fiscal IPI Família - Código',
    'Fiscal IPI Família - Nome',
    'Fiscal ICMS - Código Tributação',
    'Fiscal ICMS - Fator Reajuste',
    'Fiscal ISS - Código',
    'Fiscal ISS - Alíquota',
    'Fiscal INSS - Serviço Código',
    'Fiscal - DCR',
    'Fiscal - SEFAZ SP',

    // PIS/COFINS (16 campos)
    'Fiscal PIS - Cálculo por Unidade',
    'Fiscal PIS - Valor por Unidade',
    'Fiscal PIS - Alíquota Origem',
    'Fiscal PIS - Alíquota',
    'Fiscal PIS - Percentual Redução',
    'Fiscal PIS Retenção - Percentual',
    'Fiscal PIS Retenção - Origem',
    'Fiscal COFINS - Cálculo por Unidade',
    'Fiscal COFINS - Valor por Unidade',
    'Fiscal COFINS - Alíquota Origem',
    'Fiscal COFINS - Alíquota',
    'Fiscal COFINS - Percentual Redução',
    'Fiscal COFINS Retenção - Percentual',
    'Fiscal COFINS Retenção - Origem',
    'Fiscal Retenção CSLL - Origem',
    'Fiscal Retenção CSLL - Percentual',
    'Fiscal - Subst Total NF',
  ];

  // Build CSV content
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.map((header) => escapeCSV(header)).join(','));

  // Add data rows
  data.forEach((item) => {
    // Get first establishment from planejamento (if exists)
    const estabelecimento = item.planejamento?.item?.estabelecimento?.[0];

    const row = [
      // ===================================================================
      // FROM ITEM SEARCH (ItemSearchResultItem)
      // ===================================================================
      escapeCSV(item.item?.itemCodigo),
      escapeCSV(item.item?.itemDescricao),
      escapeCSV(item.item?.unidadeMedidaCodigo),
      escapeCSV(item.item?.unidadeMedidaDescricao),
      escapeCSV(item.item?.familiaCodigo),
      escapeCSV(item.item?.familiaDescricao),
      escapeCSV(item.item?.familiaComercialCodigo),
      escapeCSV(item.item?.familiaComercialDescricao),
      escapeCSV(item.item?.grupoEstoqueCodigo),
      escapeCSV(item.item?.grupoEstoqueDescricao),
      escapeCSV(item.item?.gtin),

      // ===================================================================
      // FROM INFORMAÇÕES GERAIS (ItemInformacoesGeraisFlat)
      // ===================================================================
      escapeCSV(item.informacoesGerais?.itemDescricaoResumida),
      escapeCSV(item.informacoesGerais?.itemDescricaoAlternativa),
      escapeCSV(item.informacoesGerais?.itemNarrativa),
      escapeCSV(item.informacoesGerais?.itemStatus),
      escapeCSV(item.informacoesGerais?.dataImplantacao),
      escapeCSV(item.informacoesGerais?.dataLiberacao),
      escapeCSV(item.informacoesGerais?.dataObsolescencia),
      escapeCSV(item.informacoesGerais?.deposito),
      escapeCSV(item.informacoesGerais?.codLocalizacao),
      escapeCSV(item.informacoesGerais?.endereco),
      escapeCSV(item.informacoesGerais?.estabelecimentoPadraoCodigo),
      escapeCSV(item.informacoesGerais?.contenedorCodigo),
      escapeCSV(item.informacoesGerais?.contenedorDescricao),
      escapeCSV(
        item.informacoesGerais?.estabelecimentos
          ?.map((e: { codigo: string; nome: string }) => `${e.codigo}-${e.nome}`)
          .join('; ')
      ),

      // ===================================================================
      // FROM DIMENSÕES (ItemDimensoes)
      // ===================================================================
      // Peça
      escapeCSV(item.dimensoes?.peca?.altura),
      escapeCSV(item.dimensoes?.peca?.largura),
      escapeCSV(item.dimensoes?.peca?.profundidade),
      escapeCSV(item.dimensoes?.peca?.peso),

      // Item
      escapeCSV(item.dimensoes?.item?.pecas),
      escapeCSV(item.dimensoes?.item?.embalagem?.altura),
      escapeCSV(item.dimensoes?.item?.embalagem?.largura),
      escapeCSV(item.dimensoes?.item?.embalagem?.profundidade),
      escapeCSV(item.dimensoes?.item?.embalagem?.peso),
      escapeCSV(item.dimensoes?.item?.embalado?.altura),
      escapeCSV(item.dimensoes?.item?.embalado?.largura),
      escapeCSV(item.dimensoes?.item?.embalado?.profundidade),
      escapeCSV(item.dimensoes?.item?.embalado?.peso),

      // Produto
      escapeCSV(item.dimensoes?.produto?.itens),
      escapeCSV(item.dimensoes?.produto?.gtin13),
      escapeCSV(item.dimensoes?.produto?.embalagem?.altura),
      escapeCSV(item.dimensoes?.produto?.embalagem?.largura),
      escapeCSV(item.dimensoes?.produto?.embalagem?.profundidade),
      escapeCSV(item.dimensoes?.produto?.embalagem?.peso),
      escapeCSV(item.dimensoes?.produto?.embalado?.altura),
      escapeCSV(item.dimensoes?.produto?.embalado?.largura),
      escapeCSV(item.dimensoes?.produto?.embalado?.profundidade),
      escapeCSV(item.dimensoes?.produto?.embalado?.peso),

      // Caixa
      escapeCSV(item.dimensoes?.caixa?.produtos),
      escapeCSV(item.dimensoes?.caixa?.gtin14),
      escapeCSV(item.dimensoes?.caixa?.embalagem?.sigla),
      escapeCSV(item.dimensoes?.caixa?.embalagem?.altura),
      escapeCSV(item.dimensoes?.caixa?.embalagem?.largura),
      escapeCSV(item.dimensoes?.caixa?.embalagem?.profundidade),
      escapeCSV(item.dimensoes?.caixa?.embalagem?.peso),

      // Palete
      escapeCSV(item.dimensoes?.palete?.lastro),
      escapeCSV(item.dimensoes?.palete?.camadas),
      escapeCSV(item.dimensoes?.palete?.caixasPalete),

      // ===================================================================
      // FROM PLANEJAMENTO (EstabelecimentoPlanejamento[0])
      // ===================================================================
      escapeCSV(estabelecimento?.codigo),
      escapeCSV(estabelecimento?.nome),

      // Produção 1
      escapeCSV(estabelecimento?.producao1?.depositoPadrao),
      escapeCSV(estabelecimento?.producao1?.localizacao),
      escapeCSV(estabelecimento?.producao1?.status),
      escapeCSV(estabelecimento?.producao1?.planejador?.codigo),
      escapeCSV(estabelecimento?.producao1?.planejador?.nome),
      escapeCSV(estabelecimento?.producao1?.linhaProducao?.codigo),
      escapeCSV(estabelecimento?.producao1?.linhaProducao?.nome),
      escapeCSV(estabelecimento?.producao1?.chaoDeFabrica?.capacidadeEstoque),
      escapeCSV(estabelecimento?.producao1?.chaoDeFabrica?.consideraAlocAtividades),
      escapeCSV(estabelecimento?.producao1?.chaoDeFabrica?.programaAlocAtividades),
      escapeCSV(estabelecimento?.producao1?.chaoDeFabrica?.percentualOverlap),

      // Produção 2
      escapeCSV(estabelecimento?.producao2?.reportaMOB),
      escapeCSV(estabelecimento?.producao2?.reportaGGF),
      escapeCSV(estabelecimento?.producao2?.tipoAlocacao),
      escapeCSV(estabelecimento?.producao2?.tipoRequisicao),
      escapeCSV(estabelecimento?.producao2?.processoCustos),
      escapeCSV(estabelecimento?.producao2?.reporteProducao),
      escapeCSV(estabelecimento?.producao2?.refugo?.tratamentoRefugo),
      escapeCSV(estabelecimento?.producao2?.refugo?.controlaEstoque),
      escapeCSV(estabelecimento?.producao2?.refugo?.precoFiscal),
      escapeCSV(estabelecimento?.producao2?.refugo?.item?.codigo),
      escapeCSV(estabelecimento?.producao2?.refugo?.item?.descricao),
      escapeCSV(estabelecimento?.producao2?.refugo?.relacaoItem),
      escapeCSV(estabelecimento?.producao2?.refugo?.fator),
      escapeCSV(estabelecimento?.producao2?.refugo?.perda),

      // Reposição
      escapeCSV(estabelecimento?.reposicao?.politica),
      escapeCSV(estabelecimento?.reposicao?.tipoDemanda),
      escapeCSV(estabelecimento?.reposicao?.lote?.multiplo),
      escapeCSV(estabelecimento?.reposicao?.lote?.minimo),
      escapeCSV(estabelecimento?.reposicao?.lote?.economico),
      escapeCSV(estabelecimento?.reposicao?.lote?.periodoFixo),
      escapeCSV(estabelecimento?.reposicao?.lote?.pontoReposicao),
      escapeCSV(estabelecimento?.reposicao?.estoqueSeguranca?.tipo),
      escapeCSV(estabelecimento?.reposicao?.estoqueSeguranca?.valor),
      escapeCSV(estabelecimento?.reposicao?.estoqueSeguranca?.converteTempo),

      // MRP
      escapeCSV(estabelecimento?.mrp?.classeReprogramacao),
      escapeCSV(estabelecimento?.mrp?.emissaoOrdens),
      escapeCSV(estabelecimento?.mrp?.divisaoOrdens),
      escapeCSV(estabelecimento?.mrp?.prioridade),
      escapeCSV(estabelecimento?.mrp?.ressuprimento?.compras?.quantidade),
      escapeCSV(estabelecimento?.mrp?.ressuprimento?.compras?.fornecedor),
      escapeCSV(estabelecimento?.mrp?.ressuprimento?.compras?.qualidade),
      escapeCSV(estabelecimento?.mrp?.ressuprimento?.fabrica?.quantidade),
      escapeCSV(estabelecimento?.mrp?.ressuprimento?.fabrica?.qualidade),
      escapeCSV(estabelecimento?.mrp?.ressuprimento?.fabrica?.minimo),
      escapeCSV(estabelecimento?.mrp?.ressuprimento?.fabrica?.variacao?.tempo),
      escapeCSV(estabelecimento?.mrp?.ressuprimento?.fabrica?.variacao?.quantidade),

      // ===================================================================
      // FROM MANUFATURA (ItemManufatura)
      // ===================================================================
      // Gerais
      escapeCSV(item.manufatura?.item?.gerais?.situacao),
      escapeCSV(item.manufatura?.item?.gerais?.tipoControle),
      escapeCSV(item.manufatura?.item?.gerais?.tipoControleEstoque),
      escapeCSV(item.manufatura?.item?.gerais?.tipoRequisicao),
      escapeCSV(item.manufatura?.item?.gerais?.consideraAlocacaoAtividades),
      escapeCSV(item.manufatura?.item?.gerais?.programaAlocacaoAtividades),
      escapeCSV(item.manufatura?.item?.gerais?.taxaOverlap),

      // Reposição
      escapeCSV(item.manufatura?.item?.reposicao?.politica),
      escapeCSV(item.manufatura?.item?.reposicao?.tipoDemanda),
      escapeCSV(item.manufatura?.item?.reposicao?.lote?.multiplo),
      escapeCSV(item.manufatura?.item?.reposicao?.lote?.minimo),
      escapeCSV(item.manufatura?.item?.reposicao?.lote?.economico),
      escapeCSV(item.manufatura?.item?.reposicao?.estoqueSeguranca?.tipo),
      escapeCSV(item.manufatura?.item?.reposicao?.estoqueSeguranca?.quantidade),
      escapeCSV(item.manufatura?.item?.reposicao?.estoqueSeguranca?.tempo),
      escapeCSV(item.manufatura?.item?.reposicao?.estoqueSeguranca?.converteTempo),
      escapeCSV(item.manufatura?.item?.reposicao?.estoqueSeguranca?.reabastecimento),
      escapeCSV(item.manufatura?.item?.reposicao?.periodoFixo),
      escapeCSV(item.manufatura?.item?.reposicao?.pontoReposicao),
      escapeCSV(item.manufatura?.item?.reposicao?.fatorRefugo),
      escapeCSV(item.manufatura?.item?.reposicao?.quantidadePerda),

      // MRP
      escapeCSV(item.manufatura?.item?.mrp?.classeReprogramacao),
      escapeCSV(item.manufatura?.item?.mrp?.emissaoOrdens),
      escapeCSV(item.manufatura?.item?.mrp?.controlePlanejamento),
      escapeCSV(item.manufatura?.item?.mrp?.divisaoOrdens),
      escapeCSV(item.manufatura?.item?.mrp?.processo),
      escapeCSV(item.manufatura?.item?.mrp?.represaDemanda),
      escapeCSV(item.manufatura?.item?.mrp?.ressuprimento?.compras),
      escapeCSV(item.manufatura?.item?.mrp?.ressuprimento?.fornecedor),
      escapeCSV(item.manufatura?.item?.mrp?.ressuprimento?.qualidade),
      escapeCSV(item.manufatura?.item?.mrp?.ressuprimento?.fabrica),
      escapeCSV(item.manufatura?.item?.mrp?.ressuprimento?.fabricaQualidade),
      escapeCSV(item.manufatura?.item?.mrp?.ressuprimento?.minimo),
      escapeCSV(item.manufatura?.item?.mrp?.ressuprimento?.variacaoTempo),
      escapeCSV(item.manufatura?.item?.mrp?.ressuprimento?.quantidade),
      escapeCSV(item.manufatura?.item?.mrp?.ressuprimento?.horizonteLiberacao),
      escapeCSV(item.manufatura?.item?.mrp?.ressuprimento?.horizonteFixo),

      // PV/MPS/CRP
      escapeCSV(item.manufatura?.item?.pvMpsCrp?.pV?.origem),
      escapeCSV(item.manufatura?.item?.pvMpsCrp?.pV?.formula),
      escapeCSV(item.manufatura?.item?.pvMpsCrp?.MPS?.criterioCalculo),
      escapeCSV(item.manufatura?.item?.pvMpsCrp?.MPS?.fatorCustoDistribuicao),
      escapeCSV(item.manufatura?.item?.pvMpsCrp?.CRP?.prioridade),
      escapeCSV(item.manufatura?.item?.pvMpsCrp?.CRP?.programacao),

      // ===================================================================
      // FROM FISCAL (ItemFiscal)
      // ===================================================================
      // Gerais
      escapeCSV(item.fiscal?.item?.gerais?.formaDescricao),
      escapeCSV(item.fiscal?.item?.gerais?.formaObtencao),
      escapeCSV(item.fiscal?.item?.gerais?.quantidadeFracionada),
      escapeCSV(item.fiscal?.item?.gerais?.loteMultiplo),
      escapeCSV(item.fiscal?.item?.gerais?.unidadeNegocio?.codigo),
      escapeCSV(item.fiscal?.item?.gerais?.unidadeNegocio?.nome),
      escapeCSV(item.fiscal?.item?.gerais?.origemUnidTrib),

      // Complementares
      escapeCSV(item.fiscal?.item?.complementares?.tipoControle),
      escapeCSV(item.fiscal?.item?.complementares?.tipoControleEstoque),
      escapeCSV(item.fiscal?.item?.complementares?.emissaoNF),
      escapeCSV(item.fiscal?.item?.complementares?.faturavel),
      escapeCSV(item.fiscal?.item?.complementares?.baixaEstoque),

      // Fiscal
      escapeCSV(item.fiscal?.item?.fiscal?.servico),
      escapeCSV(item.fiscal?.item?.fiscal?.classificacao?.codigo),
      escapeCSV(item.fiscal?.item?.fiscal?.classificacao?.ncm),
      escapeCSV(item.fiscal?.item?.fiscal?.classificacao?.nome),
      escapeCSV(item.fiscal?.item?.fiscal?.ipi?.codigoTributacao),
      escapeCSV(item.fiscal?.item?.fiscal?.ipi?.aliquota),
      escapeCSV(item.fiscal?.item?.fiscal?.ipi?.apuracao),
      escapeCSV(item.fiscal?.item?.fiscal?.ipi?.suspenso),
      escapeCSV(item.fiscal?.item?.fiscal?.ipi?.diferenciado),
      escapeCSV(item.fiscal?.item?.fiscal?.ipi?.incentivado),
      escapeCSV(item.fiscal?.item?.fiscal?.ipi?.combustivelSolvente),
      escapeCSV(item.fiscal?.item?.fiscal?.ipi?.familia?.codigo),
      escapeCSV(item.fiscal?.item?.fiscal?.ipi?.familia?.nome),
      escapeCSV(item.fiscal?.item?.fiscal?.icms?.codigoTributacao),
      escapeCSV(item.fiscal?.item?.fiscal?.icms?.fatorReajuste),
      escapeCSV(item.fiscal?.item?.fiscal?.iss?.codigo),
      escapeCSV(item.fiscal?.item?.fiscal?.iss?.aliquota),
      escapeCSV(item.fiscal?.item?.fiscal?.inss?.servicoCodigo),
      escapeCSV(item.fiscal?.item?.fiscal?.DCR),
      escapeCSV(item.fiscal?.item?.fiscal?.sefazSP),

      // PIS/COFINS
      escapeCSV(item.fiscal?.item?.pisCofins?.pis?.calculoPorUnidade),
      escapeCSV(item.fiscal?.item?.pisCofins?.pis?.valorPorUnidade),
      escapeCSV(item.fiscal?.item?.pisCofins?.pis?.aliquotaOrigem),
      escapeCSV(item.fiscal?.item?.pisCofins?.pis?.aliquota),
      escapeCSV(item.fiscal?.item?.pisCofins?.pis?.percentualReducao),
      escapeCSV(item.fiscal?.item?.pisCofins?.pis?.retencao?.percentual),
      escapeCSV(item.fiscal?.item?.pisCofins?.pis?.retencao?.origem),
      escapeCSV(item.fiscal?.item?.pisCofins?.cofins?.calculoPorUnidade),
      escapeCSV(item.fiscal?.item?.pisCofins?.cofins?.valorPorUnidade),
      escapeCSV(item.fiscal?.item?.pisCofins?.cofins?.aliquotaOrigem),
      escapeCSV(item.fiscal?.item?.pisCofins?.cofins?.aliquota),
      escapeCSV(item.fiscal?.item?.pisCofins?.cofins?.percentualReducao),
      escapeCSV(item.fiscal?.item?.pisCofins?.cofins?.retencao?.percentual),
      escapeCSV(item.fiscal?.item?.pisCofins?.cofins?.retencao?.origem),
      escapeCSV(item.fiscal?.item?.pisCofins?.retencaoCsll?.origem),
      escapeCSV(item.fiscal?.item?.pisCofins?.retencaoCsll?.percentual),
      escapeCSV(item.fiscal?.item?.pisCofins?.substTotalNF),
    ];

    csvRows.push(row.join(','));
  });

  // Join all rows with newline
  const csvContent = csvRows.join('\n');

  // Create timestamp for filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Trigger download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
};
