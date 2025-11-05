import * as XLSX from 'xlsx';
import { CompleteItemData } from '../../services/catalogExport.service';

/**
 * Export catalog data to XLSX format with all data in a single sheet
 * Includes ALL 250+ fields from all tabs (same structure as CSV export)
 * @param data - Array of complete item data
 * @param filename - Base filename for the export (default: 'catalogo_itens')
 */
export const exportCatalogToXLSXSingle = (
  data: CompleteItemData[],
  filename: string = 'catalogo_itens'
) => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Map data to flattened objects with ALL 250+ columns (same as CSV)
  const exportData = data.map((itemData) => {
    // Get first establishment from planejamento (if exists)
    const estabelecimento = itemData.planejamento?.item?.estabelecimento?.[0];

    return {
      // ===================================================================
      // FROM ITEM SEARCH (ItemSearchResultItem) - 11 fields
      // ===================================================================
      'Código Item': itemData.item?.itemCodigo ?? '',
      'Descrição Item': itemData.item?.itemDescricao ?? '',
      'Código Unidade Medida': itemData.item?.unidadeMedidaCodigo ?? '',
      'Descrição Unidade Medida': itemData.item?.unidadeMedidaDescricao ?? '',
      'Código Família': itemData.item?.familiaCodigo ?? '',
      'Descrição Família': itemData.item?.familiaDescricao ?? '',
      'Código Família Comercial': itemData.item?.familiaComercialCodigo ?? '',
      'Descrição Família Comercial': itemData.item?.familiaComercialDescricao ?? '',
      'Código Grupo Estoque': itemData.item?.grupoEstoqueCodigo ?? '',
      'Descrição Grupo Estoque': itemData.item?.grupoEstoqueDescricao ?? '',
      GTIN: itemData.item?.gtin ?? '',

      // ===================================================================
      // FROM INFORMAÇÕES GERAIS (ItemInformacoesGeraisFlat) - 14 fields
      // ===================================================================
      'Descrição Resumida': itemData.informacoesGerais?.itemDescricaoResumida ?? '',
      'Descrição Alternativa': itemData.informacoesGerais?.itemDescricaoAlternativa ?? '',
      'Narrativa Item': itemData.informacoesGerais?.itemNarrativa ?? '',
      'Status Item': itemData.informacoesGerais?.itemStatus ?? '',
      'Data Implantação': itemData.informacoesGerais?.dataImplantacao ?? '',
      'Data Liberação': itemData.informacoesGerais?.dataLiberacao ?? '',
      'Data Obsolescência': itemData.informacoesGerais?.dataObsolescencia ?? '',
      Depósito: itemData.informacoesGerais?.deposito ?? '',
      'Código Localização': itemData.informacoesGerais?.codLocalizacao ?? '',
      Endereço: itemData.informacoesGerais?.endereco ?? '',
      'Estabelecimento Padrão Código':
        itemData.informacoesGerais?.estabelecimentoPadraoCodigo ?? '',
      'Código Contenedor': itemData.informacoesGerais?.contenedorCodigo ?? '',
      'Descrição Contenedor': itemData.informacoesGerais?.contenedorDescricao ?? '',
      'Estabelecimentos (Lista)':
        itemData.informacoesGerais?.estabelecimentos
          ?.map((e: { codigo: string; nome: string }) => `${e.codigo}-${e.nome}`)
          .join('; ') ?? '',

      // ===================================================================
      // FROM DIMENSÕES (ItemDimensoes) - 45 fields
      // ===================================================================
      // Peça (4 campos)
      'Peça - Altura': itemData.dimensoes?.peca?.altura ?? '',
      'Peça - Largura': itemData.dimensoes?.peca?.largura ?? '',
      'Peça - Profundidade': itemData.dimensoes?.peca?.profundidade ?? '',
      'Peça - Peso': itemData.dimensoes?.peca?.peso ?? '',

      // Item (9 campos)
      'Item - Número de Peças': itemData.dimensoes?.item?.pecas ?? '',
      'Item Embalagem - Altura': itemData.dimensoes?.item?.embalagem?.altura ?? '',
      'Item Embalagem - Largura': itemData.dimensoes?.item?.embalagem?.largura ?? '',
      'Item Embalagem - Profundidade': itemData.dimensoes?.item?.embalagem?.profundidade ?? '',
      'Item Embalagem - Peso': itemData.dimensoes?.item?.embalagem?.peso ?? '',
      'Item Embalado - Altura': itemData.dimensoes?.item?.embalado?.altura ?? '',
      'Item Embalado - Largura': itemData.dimensoes?.item?.embalado?.largura ?? '',
      'Item Embalado - Profundidade': itemData.dimensoes?.item?.embalado?.profundidade ?? '',
      'Item Embalado - Peso': itemData.dimensoes?.item?.embalado?.peso ?? '',

      // Produto (11 campos)
      'Produto - Número de Itens': itemData.dimensoes?.produto?.itens ?? '',
      'Produto - GTIN13': itemData.dimensoes?.produto?.gtin13 ?? '',
      'Produto Embalagem - Altura': itemData.dimensoes?.produto?.embalagem?.altura ?? '',
      'Produto Embalagem - Largura': itemData.dimensoes?.produto?.embalagem?.largura ?? '',
      'Produto Embalagem - Profundidade':
        itemData.dimensoes?.produto?.embalagem?.profundidade ?? '',
      'Produto Embalagem - Peso': itemData.dimensoes?.produto?.embalagem?.peso ?? '',
      'Produto Embalado - Altura': itemData.dimensoes?.produto?.embalado?.altura ?? '',
      'Produto Embalado - Largura': itemData.dimensoes?.produto?.embalado?.largura ?? '',
      'Produto Embalado - Profundidade': itemData.dimensoes?.produto?.embalado?.profundidade ?? '',
      'Produto Embalado - Peso': itemData.dimensoes?.produto?.embalado?.peso ?? '',

      // Caixa (8 campos)
      'Caixa - Número de Produtos': itemData.dimensoes?.caixa?.produtos ?? '',
      'Caixa - GTIN14': itemData.dimensoes?.caixa?.gtin14 ?? '',
      'Caixa Embalagem - Sigla': itemData.dimensoes?.caixa?.embalagem?.sigla ?? '',
      'Caixa Embalagem - Altura': itemData.dimensoes?.caixa?.embalagem?.altura ?? '',
      'Caixa Embalagem - Largura': itemData.dimensoes?.caixa?.embalagem?.largura ?? '',
      'Caixa Embalagem - Profundidade': itemData.dimensoes?.caixa?.embalagem?.profundidade ?? '',
      'Caixa Embalagem - Peso': itemData.dimensoes?.caixa?.embalagem?.peso ?? '',

      // Palete (3 campos)
      'Palete - Lastro': itemData.dimensoes?.palete?.lastro ?? '',
      'Palete - Camadas': itemData.dimensoes?.palete?.camadas ?? '',
      'Palete - Caixas por Palete': itemData.dimensoes?.palete?.caixasPalete ?? '',

      // ===================================================================
      // FROM PLANEJAMENTO (EstabelecimentoPlanejamento[0]) - 60+ fields
      // ===================================================================
      'Planejamento - Código Estabelecimento': estabelecimento?.codigo ?? '',
      'Planejamento - Nome Estabelecimento': estabelecimento?.nome ?? '',

      // Produção 1 (10 campos)
      'Prod1 - Depósito Padrão': estabelecimento?.producao1?.depositoPadrao ?? '',
      'Prod1 - Localização': estabelecimento?.producao1?.localizacao ?? '',
      'Prod1 - Status': estabelecimento?.producao1?.status ?? '',
      'Prod1 Planejador - Código': estabelecimento?.producao1?.planejador?.codigo ?? '',
      'Prod1 Planejador - Nome': estabelecimento?.producao1?.planejador?.nome ?? '',
      'Prod1 Linha Produção - Código': estabelecimento?.producao1?.linhaProducao?.codigo ?? '',
      'Prod1 Linha Produção - Nome': estabelecimento?.producao1?.linhaProducao?.nome ?? '',
      'Prod1 Chão Fábrica - Capacidade Estoque':
        estabelecimento?.producao1?.chaoDeFabrica?.capacidadeEstoque ?? '',
      'Prod1 Chão Fábrica - Considera Aloc Atividades':
        estabelecimento?.producao1?.chaoDeFabrica?.consideraAlocAtividades ?? '',
      'Prod1 Chão Fábrica - Programa Aloc Atividades':
        estabelecimento?.producao1?.chaoDeFabrica?.programaAlocAtividades ?? '',
      'Prod1 Chão Fábrica - Percentual Overlap':
        estabelecimento?.producao1?.chaoDeFabrica?.percentualOverlap ?? '',

      // Produção 2 (15 campos)
      'Prod2 - Reporta MOB': estabelecimento?.producao2?.reportaMOB ?? '',
      'Prod2 - Reporta GGF': estabelecimento?.producao2?.reportaGGF ?? '',
      'Prod2 - Tipo Alocação': estabelecimento?.producao2?.tipoAlocacao ?? '',
      'Prod2 - Tipo Requisição': estabelecimento?.producao2?.tipoRequisicao ?? '',
      'Prod2 - Processo Custos': estabelecimento?.producao2?.processoCustos ?? '',
      'Prod2 - Reporte Produção': estabelecimento?.producao2?.reporteProducao ?? '',
      'Prod2 Refugo - Tratamento': estabelecimento?.producao2?.refugo?.tratamentoRefugo ?? '',
      'Prod2 Refugo - Controla Estoque': estabelecimento?.producao2?.refugo?.controlaEstoque ?? '',
      'Prod2 Refugo - Preço Fiscal': estabelecimento?.producao2?.refugo?.precoFiscal ?? '',
      'Prod2 Refugo Item - Código': estabelecimento?.producao2?.refugo?.item?.codigo ?? '',
      'Prod2 Refugo Item - Descrição': estabelecimento?.producao2?.refugo?.item?.descricao ?? '',
      'Prod2 Refugo - Relação Item': estabelecimento?.producao2?.refugo?.relacaoItem ?? '',
      'Prod2 Refugo - Fator': estabelecimento?.producao2?.refugo?.fator ?? '',
      'Prod2 Refugo - Perda': estabelecimento?.producao2?.refugo?.perda ?? '',

      // Reposição (10 campos)
      'Reposição - Política': estabelecimento?.reposicao?.politica ?? '',
      'Reposição - Tipo Demanda': estabelecimento?.reposicao?.tipoDemanda ?? '',
      'Reposição Lote - Múltiplo': estabelecimento?.reposicao?.lote?.multiplo ?? '',
      'Reposição Lote - Mínimo': estabelecimento?.reposicao?.lote?.minimo ?? '',
      'Reposição Lote - Econômico': estabelecimento?.reposicao?.lote?.economico ?? '',
      'Reposição Lote - Período Fixo': estabelecimento?.reposicao?.lote?.periodoFixo ?? '',
      'Reposição Lote - Ponto Reposição': estabelecimento?.reposicao?.lote?.pontoReposicao ?? '',
      'Reposição Est Segurança - Tipo': estabelecimento?.reposicao?.estoqueSeguranca?.tipo ?? '',
      'Reposição Est Segurança - Valor': estabelecimento?.reposicao?.estoqueSeguranca?.valor ?? '',
      'Reposição Est Segurança - Converte Tempo':
        estabelecimento?.reposicao?.estoqueSeguranca?.converteTempo ?? '',

      // MRP (14 campos)
      'MRP - Classe Reprogramação': estabelecimento?.mrp?.classeReprogramacao ?? '',
      'MRP - Emissão Ordens': estabelecimento?.mrp?.emissaoOrdens ?? '',
      'MRP - Divisão Ordens': estabelecimento?.mrp?.divisaoOrdens ?? '',
      'MRP - Prioridade': estabelecimento?.mrp?.prioridade ?? '',
      'MRP Ressup Compras - Quantidade':
        estabelecimento?.mrp?.ressuprimento?.compras?.quantidade ?? '',
      'MRP Ressup Compras - Fornecedor':
        estabelecimento?.mrp?.ressuprimento?.compras?.fornecedor ?? '',
      'MRP Ressup Compras - Qualidade':
        estabelecimento?.mrp?.ressuprimento?.compras?.qualidade ?? '',
      'MRP Ressup Fábrica - Quantidade':
        estabelecimento?.mrp?.ressuprimento?.fabrica?.quantidade ?? '',
      'MRP Ressup Fábrica - Qualidade':
        estabelecimento?.mrp?.ressuprimento?.fabrica?.qualidade ?? '',
      'MRP Ressup Fábrica - Mínimo': estabelecimento?.mrp?.ressuprimento?.fabrica?.minimo ?? '',
      'MRP Ressup Fábrica Variação - Tempo':
        estabelecimento?.mrp?.ressuprimento?.fabrica?.variacao?.tempo ?? '',
      'MRP Ressup Fábrica Variação - Quantidade':
        estabelecimento?.mrp?.ressuprimento?.fabrica?.variacao?.quantidade ?? '',

      // ===================================================================
      // FROM MANUFATURA (ItemManufatura) - 50+ fields
      // ===================================================================
      // Gerais (7 campos)
      'Manuf Gerais - Situação': itemData.manufatura?.item?.gerais?.situacao ?? '',
      'Manuf Gerais - Tipo Controle': itemData.manufatura?.item?.gerais?.tipoControle ?? '',
      'Manuf Gerais - Tipo Controle Estoque':
        itemData.manufatura?.item?.gerais?.tipoControleEstoque ?? '',
      'Manuf Gerais - Tipo Requisição': itemData.manufatura?.item?.gerais?.tipoRequisicao ?? '',
      'Manuf Gerais - Considera Alocação Atividades':
        itemData.manufatura?.item?.gerais?.consideraAlocacaoAtividades ?? '',
      'Manuf Gerais - Programa Alocação Atividades':
        itemData.manufatura?.item?.gerais?.programaAlocacaoAtividades ?? '',
      'Manuf Gerais - Taxa Overlap': itemData.manufatura?.item?.gerais?.taxaOverlap ?? '',

      // Reposição (13 campos)
      'Manuf Reposição - Política': itemData.manufatura?.item?.reposicao?.politica ?? '',
      'Manuf Reposição - Tipo Demanda': itemData.manufatura?.item?.reposicao?.tipoDemanda ?? '',
      'Manuf Reposição Lote - Múltiplo': itemData.manufatura?.item?.reposicao?.lote?.multiplo ?? '',
      'Manuf Reposição Lote - Mínimo': itemData.manufatura?.item?.reposicao?.lote?.minimo ?? '',
      'Manuf Reposição Lote - Econômico':
        itemData.manufatura?.item?.reposicao?.lote?.economico ?? '',
      'Manuf Reposição Est Seg - Tipo':
        itemData.manufatura?.item?.reposicao?.estoqueSeguranca?.tipo ?? '',
      'Manuf Reposição Est Seg - Quantidade':
        itemData.manufatura?.item?.reposicao?.estoqueSeguranca?.quantidade ?? '',
      'Manuf Reposição Est Seg - Tempo':
        itemData.manufatura?.item?.reposicao?.estoqueSeguranca?.tempo ?? '',
      'Manuf Reposição Est Seg - Converte Tempo':
        itemData.manufatura?.item?.reposicao?.estoqueSeguranca?.converteTempo ?? '',
      'Manuf Reposição Est Seg - Reabastecimento':
        itemData.manufatura?.item?.reposicao?.estoqueSeguranca?.reabastecimento ?? '',
      'Manuf Reposição - Período Fixo': itemData.manufatura?.item?.reposicao?.periodoFixo ?? '',
      'Manuf Reposição - Ponto Reposição':
        itemData.manufatura?.item?.reposicao?.pontoReposicao ?? '',
      'Manuf Reposição - Fator Refugo': itemData.manufatura?.item?.reposicao?.fatorRefugo ?? '',
      'Manuf Reposição - Quantidade Perda':
        itemData.manufatura?.item?.reposicao?.quantidadePerda ?? '',

      // MRP (17 campos)
      'Manuf MRP - Classe Reprogramação': itemData.manufatura?.item?.mrp?.classeReprogramacao ?? '',
      'Manuf MRP - Emissão Ordens': itemData.manufatura?.item?.mrp?.emissaoOrdens ?? '',
      'Manuf MRP - Controle Planejamento':
        itemData.manufatura?.item?.mrp?.controlePlanejamento ?? '',
      'Manuf MRP - Divisão Ordens': itemData.manufatura?.item?.mrp?.divisaoOrdens ?? '',
      'Manuf MRP - Processo': itemData.manufatura?.item?.mrp?.processo ?? '',
      'Manuf MRP - Represa Demanda': itemData.manufatura?.item?.mrp?.represaDemanda ?? '',
      'Manuf MRP Ressup - Compras': itemData.manufatura?.item?.mrp?.ressuprimento?.compras ?? '',
      'Manuf MRP Ressup - Fornecedor':
        itemData.manufatura?.item?.mrp?.ressuprimento?.fornecedor ?? '',
      'Manuf MRP Ressup - Qualidade':
        itemData.manufatura?.item?.mrp?.ressuprimento?.qualidade ?? '',
      'Manuf MRP Ressup - Fábrica': itemData.manufatura?.item?.mrp?.ressuprimento?.fabrica ?? '',
      'Manuf MRP Ressup - Fábrica Qualidade':
        itemData.manufatura?.item?.mrp?.ressuprimento?.fabricaQualidade ?? '',
      'Manuf MRP Ressup - Mínimo': itemData.manufatura?.item?.mrp?.ressuprimento?.minimo ?? '',
      'Manuf MRP Ressup - Variação Tempo':
        itemData.manufatura?.item?.mrp?.ressuprimento?.variacaoTempo ?? '',
      'Manuf MRP Ressup - Quantidade':
        itemData.manufatura?.item?.mrp?.ressuprimento?.quantidade ?? '',
      'Manuf MRP Ressup - Horizonte Liberação':
        itemData.manufatura?.item?.mrp?.ressuprimento?.horizonteLiberacao ?? '',
      'Manuf MRP Ressup - Horizonte Fixo':
        itemData.manufatura?.item?.mrp?.ressuprimento?.horizonteFixo ?? '',

      // PV/MPS/CRP (7 campos)
      'Manuf PV - Origem': itemData.manufatura?.item?.pvMpsCrp?.pV?.origem ?? '',
      'Manuf PV - Fórmula': itemData.manufatura?.item?.pvMpsCrp?.pV?.formula ?? '',
      'Manuf MPS - Critério Cálculo':
        itemData.manufatura?.item?.pvMpsCrp?.MPS?.criterioCalculo ?? '',
      'Manuf MPS - Fator Custo Distribuição':
        itemData.manufatura?.item?.pvMpsCrp?.MPS?.fatorCustoDistribuicao ?? '',
      'Manuf CRP - Prioridade': itemData.manufatura?.item?.pvMpsCrp?.CRP?.prioridade ?? '',
      'Manuf CRP - Programação': itemData.manufatura?.item?.pvMpsCrp?.CRP?.programacao ?? '',

      // ===================================================================
      // FROM FISCAL (ItemFiscal) - 60+ fields
      // ===================================================================
      // Gerais (6 campos)
      'Fiscal Gerais - Forma Descrição': itemData.fiscal?.item?.gerais?.formaDescricao ?? '',
      'Fiscal Gerais - Forma Obtenção': itemData.fiscal?.item?.gerais?.formaObtencao ?? '',
      'Fiscal Gerais - Quantidade Fracionada':
        itemData.fiscal?.item?.gerais?.quantidadeFracionada ?? '',
      'Fiscal Gerais - Lote Múltiplo': itemData.fiscal?.item?.gerais?.loteMultiplo ?? '',
      'Fiscal Gerais Unidade Negócio - Código':
        itemData.fiscal?.item?.gerais?.unidadeNegocio?.codigo ?? '',
      'Fiscal Gerais Unidade Negócio - Nome':
        itemData.fiscal?.item?.gerais?.unidadeNegocio?.nome ?? '',
      'Fiscal Gerais - Origem Unid Trib': itemData.fiscal?.item?.gerais?.origemUnidTrib ?? '',

      // Complementares (5 campos)
      'Fiscal Compl - Tipo Controle': itemData.fiscal?.item?.complementares?.tipoControle ?? '',
      'Fiscal Compl - Tipo Controle Estoque':
        itemData.fiscal?.item?.complementares?.tipoControleEstoque ?? '',
      'Fiscal Compl - Emissão NF': itemData.fiscal?.item?.complementares?.emissaoNF ?? '',
      'Fiscal Compl - Faturável': itemData.fiscal?.item?.complementares?.faturavel ?? '',
      'Fiscal Compl - Baixa Estoque': itemData.fiscal?.item?.complementares?.baixaEstoque ?? '',

      // Fiscal (13 campos)
      'Fiscal - Serviço': itemData.fiscal?.item?.fiscal?.servico ?? '',
      'Fiscal Classificação - Código': itemData.fiscal?.item?.fiscal?.classificacao?.codigo ?? '',
      'Fiscal Classificação - NCM': itemData.fiscal?.item?.fiscal?.classificacao?.ncm ?? '',
      'Fiscal Classificação - Nome': itemData.fiscal?.item?.fiscal?.classificacao?.nome ?? '',
      'Fiscal IPI - Código Tributação': itemData.fiscal?.item?.fiscal?.ipi?.codigoTributacao ?? '',
      'Fiscal IPI - Alíquota': itemData.fiscal?.item?.fiscal?.ipi?.aliquota ?? '',
      'Fiscal IPI - Apuração': itemData.fiscal?.item?.fiscal?.ipi?.apuracao ?? '',
      'Fiscal IPI - Suspenso': itemData.fiscal?.item?.fiscal?.ipi?.suspenso ?? '',
      'Fiscal IPI - Diferenciado': itemData.fiscal?.item?.fiscal?.ipi?.diferenciado ?? '',
      'Fiscal IPI - Incentivado': itemData.fiscal?.item?.fiscal?.ipi?.incentivado ?? '',
      'Fiscal IPI - Combustível/Solvente':
        itemData.fiscal?.item?.fiscal?.ipi?.combustivelSolvente ?? '',
      'Fiscal IPI Família - Código': itemData.fiscal?.item?.fiscal?.ipi?.familia?.codigo ?? '',
      'Fiscal IPI Família - Nome': itemData.fiscal?.item?.fiscal?.ipi?.familia?.nome ?? '',
      'Fiscal ICMS - Código Tributação':
        itemData.fiscal?.item?.fiscal?.icms?.codigoTributacao ?? '',
      'Fiscal ICMS - Fator Reajuste': itemData.fiscal?.item?.fiscal?.icms?.fatorReajuste ?? '',
      'Fiscal ISS - Código': itemData.fiscal?.item?.fiscal?.iss?.codigo ?? '',
      'Fiscal ISS - Alíquota': itemData.fiscal?.item?.fiscal?.iss?.aliquota ?? '',
      'Fiscal INSS - Serviço Código': itemData.fiscal?.item?.fiscal?.inss?.servicoCodigo ?? '',
      'Fiscal - DCR': itemData.fiscal?.item?.fiscal?.DCR ?? '',
      'Fiscal - SEFAZ SP': itemData.fiscal?.item?.fiscal?.sefazSP ?? '',

      // PIS/COFINS (16 campos)
      'Fiscal PIS - Cálculo por Unidade':
        itemData.fiscal?.item?.pisCofins?.pis?.calculoPorUnidade ?? '',
      'Fiscal PIS - Valor por Unidade':
        itemData.fiscal?.item?.pisCofins?.pis?.valorPorUnidade ?? '',
      'Fiscal PIS - Alíquota Origem': itemData.fiscal?.item?.pisCofins?.pis?.aliquotaOrigem ?? '',
      'Fiscal PIS - Alíquota': itemData.fiscal?.item?.pisCofins?.pis?.aliquota ?? '',
      'Fiscal PIS - Percentual Redução':
        itemData.fiscal?.item?.pisCofins?.pis?.percentualReducao ?? '',
      'Fiscal PIS Retenção - Percentual':
        itemData.fiscal?.item?.pisCofins?.pis?.retencao?.percentual ?? '',
      'Fiscal PIS Retenção - Origem': itemData.fiscal?.item?.pisCofins?.pis?.retencao?.origem ?? '',
      'Fiscal COFINS - Cálculo por Unidade':
        itemData.fiscal?.item?.pisCofins?.cofins?.calculoPorUnidade ?? '',
      'Fiscal COFINS - Valor por Unidade':
        itemData.fiscal?.item?.pisCofins?.cofins?.valorPorUnidade ?? '',
      'Fiscal COFINS - Alíquota Origem':
        itemData.fiscal?.item?.pisCofins?.cofins?.aliquotaOrigem ?? '',
      'Fiscal COFINS - Alíquota': itemData.fiscal?.item?.pisCofins?.cofins?.aliquota ?? '',
      'Fiscal COFINS - Percentual Redução':
        itemData.fiscal?.item?.pisCofins?.cofins?.percentualReducao ?? '',
      'Fiscal COFINS Retenção - Percentual':
        itemData.fiscal?.item?.pisCofins?.cofins?.retencao?.percentual ?? '',
      'Fiscal COFINS Retenção - Origem':
        itemData.fiscal?.item?.pisCofins?.cofins?.retencao?.origem ?? '',
      'Fiscal Retenção CSLL - Origem': itemData.fiscal?.item?.pisCofins?.retencaoCsll?.origem ?? '',
      'Fiscal Retenção CSLL - Percentual':
        itemData.fiscal?.item?.pisCofins?.retencaoCsll?.percentual ?? '',
      'Fiscal - Subst Total NF': itemData.fiscal?.item?.pisCofins?.substTotalNF ?? '',
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for ALL 250+ columns
  worksheet['!cols'] = [
    // FROM ITEM SEARCH (11 columns)
    { wch: 15 }, // Código Item
    { wch: 50 }, // Descrição Item
    { wch: 15 }, // Código Unidade Medida
    { wch: 30 }, // Descrição Unidade Medida
    { wch: 15 }, // Código Família
    { wch: 40 }, // Descrição Família
    { wch: 20 }, // Código Família Comercial
    { wch: 40 }, // Descrição Família Comercial
    { wch: 20 }, // Código Grupo Estoque
    { wch: 40 }, // Descrição Grupo Estoque
    { wch: 15 }, // GTIN

    // FROM INFORMAÇÕES GERAIS (14 columns)
    { wch: 40 }, // Descrição Resumida
    { wch: 40 }, // Descrição Alternativa
    { wch: 50 }, // Narrativa Item
    { wch: 15 }, // Status Item
    { wch: 18 }, // Data Implantação
    { wch: 18 }, // Data Liberação
    { wch: 18 }, // Data Obsolescência
    { wch: 20 }, // Depósito
    { wch: 20 }, // Código Localização
    { wch: 30 }, // Endereço
    { wch: 25 }, // Estabelecimento Padrão Código
    { wch: 20 }, // Código Contenedor
    { wch: 30 }, // Descrição Contenedor
    { wch: 50 }, // Estabelecimentos (Lista)

    // FROM DIMENSÕES - Peça (4 columns)
    { wch: 15 }, // Peça - Altura
    { wch: 15 }, // Peça - Largura
    { wch: 15 }, // Peça - Profundidade
    { wch: 15 }, // Peça - Peso

    // FROM DIMENSÕES - Item (9 columns)
    { wch: 18 }, // Item - Número de Peças
    { wch: 18 }, // Item Embalagem - Altura
    { wch: 18 }, // Item Embalagem - Largura
    { wch: 20 }, // Item Embalagem - Profundidade
    { wch: 18 }, // Item Embalagem - Peso
    { wch: 18 }, // Item Embalado - Altura
    { wch: 18 }, // Item Embalado - Largura
    { wch: 20 }, // Item Embalado - Profundidade
    { wch: 18 }, // Item Embalado - Peso

    // FROM DIMENSÕES - Produto (11 columns)
    { wch: 20 }, // Produto - Número de Itens
    { wch: 15 }, // Produto - GTIN13
    { wch: 20 }, // Produto Embalagem - Altura
    { wch: 20 }, // Produto Embalagem - Largura
    { wch: 22 }, // Produto Embalagem - Profundidade
    { wch: 20 }, // Produto Embalagem - Peso
    { wch: 20 }, // Produto Embalado - Altura
    { wch: 20 }, // Produto Embalado - Largura
    { wch: 22 }, // Produto Embalado - Profundidade
    { wch: 20 }, // Produto Embalado - Peso

    // FROM DIMENSÕES - Caixa (8 columns)
    { wch: 22 }, // Caixa - Número de Produtos
    { wch: 15 }, // Caixa - GTIN14
    { wch: 18 }, // Caixa Embalagem - Sigla
    { wch: 18 }, // Caixa Embalagem - Altura
    { wch: 18 }, // Caixa Embalagem - Largura
    { wch: 20 }, // Caixa Embalagem - Profundidade
    { wch: 18 }, // Caixa Embalagem - Peso

    // FROM DIMENSÕES - Palete (3 columns)
    { wch: 15 }, // Palete - Lastro
    { wch: 15 }, // Palete - Camadas
    { wch: 20 }, // Palete - Caixas por Palete

    // FROM PLANEJAMENTO - Estabelecimento (2 columns)
    { wch: 25 }, // Planejamento - Código Estabelecimento
    { wch: 30 }, // Planejamento - Nome Estabelecimento

    // FROM PLANEJAMENTO - Produção 1 (11 columns)
    { wch: 20 }, // Prod1 - Depósito Padrão
    { wch: 20 }, // Prod1 - Localização
    { wch: 15 }, // Prod1 - Status
    { wch: 20 }, // Prod1 Planejador - Código
    { wch: 30 }, // Prod1 Planejador - Nome
    { wch: 25 }, // Prod1 Linha Produção - Código
    { wch: 30 }, // Prod1 Linha Produção - Nome
    { wch: 25 }, // Prod1 Chão Fábrica - Capacidade Estoque
    { wch: 30 }, // Prod1 Chão Fábrica - Considera Aloc Atividades
    { wch: 30 }, // Prod1 Chão Fábrica - Programa Aloc Atividades
    { wch: 25 }, // Prod1 Chão Fábrica - Percentual Overlap

    // FROM PLANEJAMENTO - Produção 2 (14 columns)
    { wch: 18 }, // Prod2 - Reporta MOB
    { wch: 18 }, // Prod2 - Reporta GGF
    { wch: 18 }, // Prod2 - Tipo Alocação
    { wch: 18 }, // Prod2 - Tipo Requisição
    { wch: 18 }, // Prod2 - Processo Custos
    { wch: 18 }, // Prod2 - Reporte Produção
    { wch: 20 }, // Prod2 Refugo - Tratamento
    { wch: 22 }, // Prod2 Refugo - Controla Estoque
    { wch: 20 }, // Prod2 Refugo - Preço Fiscal
    { wch: 25 }, // Prod2 Refugo Item - Código
    { wch: 30 }, // Prod2 Refugo Item - Descrição
    { wch: 20 }, // Prod2 Refugo - Relação Item
    { wch: 15 }, // Prod2 Refugo - Fator
    { wch: 15 }, // Prod2 Refugo - Perda

    // FROM PLANEJAMENTO - Reposição (10 columns)
    { wch: 18 }, // Reposição - Política
    { wch: 18 }, // Reposição - Tipo Demanda
    { wch: 20 }, // Reposição Lote - Múltiplo
    { wch: 20 }, // Reposição Lote - Mínimo
    { wch: 20 }, // Reposição Lote - Econômico
    { wch: 22 }, // Reposição Lote - Período Fixo
    { wch: 25 }, // Reposição Lote - Ponto Reposição
    { wch: 25 }, // Reposição Est Segurança - Tipo
    { wch: 25 }, // Reposição Est Segurança - Valor
    { wch: 30 }, // Reposição Est Segurança - Converte Tempo

    // FROM PLANEJAMENTO - MRP (12 columns)
    { wch: 25 }, // MRP - Classe Reprogramação
    { wch: 18 }, // MRP - Emissão Ordens
    { wch: 18 }, // MRP - Divisão Ordens
    { wch: 15 }, // MRP - Prioridade
    { wch: 25 }, // MRP Ressup Compras - Quantidade
    { wch: 25 }, // MRP Ressup Compras - Fornecedor
    { wch: 25 }, // MRP Ressup Compras - Qualidade
    { wch: 25 }, // MRP Ressup Fábrica - Quantidade
    { wch: 25 }, // MRP Ressup Fábrica - Qualidade
    { wch: 25 }, // MRP Ressup Fábrica - Mínimo
    { wch: 30 }, // MRP Ressup Fábrica Variação - Tempo
    { wch: 30 }, // MRP Ressup Fábrica Variação - Quantidade

    // FROM MANUFATURA - Gerais (7 columns)
    { wch: 20 }, // Manuf Gerais - Situação
    { wch: 25 }, // Manuf Gerais - Tipo Controle
    { wch: 30 }, // Manuf Gerais - Tipo Controle Estoque
    { wch: 25 }, // Manuf Gerais - Tipo Requisição
    { wch: 35 }, // Manuf Gerais - Considera Alocação Atividades
    { wch: 35 }, // Manuf Gerais - Programa Alocação Atividades
    { wch: 20 }, // Manuf Gerais - Taxa Overlap

    // FROM MANUFATURA - Reposição (14 columns)
    { wch: 25 }, // Manuf Reposição - Política
    { wch: 25 }, // Manuf Reposição - Tipo Demanda
    { wch: 25 }, // Manuf Reposição Lote - Múltiplo
    { wch: 25 }, // Manuf Reposição Lote - Mínimo
    { wch: 25 }, // Manuf Reposição Lote - Econômico
    { wch: 30 }, // Manuf Reposição Est Seg - Tipo
    { wch: 30 }, // Manuf Reposição Est Seg - Quantidade
    { wch: 30 }, // Manuf Reposição Est Seg - Tempo
    { wch: 30 }, // Manuf Reposição Est Seg - Converte Tempo
    { wch: 30 }, // Manuf Reposição Est Seg - Reabastecimento
    { wch: 25 }, // Manuf Reposição - Período Fixo
    { wch: 25 }, // Manuf Reposição - Ponto Reposição
    { wch: 25 }, // Manuf Reposição - Fator Refugo
    { wch: 25 }, // Manuf Reposição - Quantidade Perda

    // FROM MANUFATURA - MRP (16 columns)
    { wch: 30 }, // Manuf MRP - Classe Reprogramação
    { wch: 25 }, // Manuf MRP - Emissão Ordens
    { wch: 30 }, // Manuf MRP - Controle Planejamento
    { wch: 25 }, // Manuf MRP - Divisão Ordens
    { wch: 20 }, // Manuf MRP - Processo
    { wch: 25 }, // Manuf MRP - Represa Demanda
    { wch: 25 }, // Manuf MRP Ressup - Compras
    { wch: 25 }, // Manuf MRP Ressup - Fornecedor
    { wch: 25 }, // Manuf MRP Ressup - Qualidade
    { wch: 25 }, // Manuf MRP Ressup - Fábrica
    { wch: 30 }, // Manuf MRP Ressup - Fábrica Qualidade
    { wch: 25 }, // Manuf MRP Ressup - Mínimo
    { wch: 30 }, // Manuf MRP Ressup - Variação Tempo
    { wch: 25 }, // Manuf MRP Ressup - Quantidade
    { wch: 30 }, // Manuf MRP Ressup - Horizonte Liberação
    { wch: 30 }, // Manuf MRP Ressup - Horizonte Fixo

    // FROM MANUFATURA - PV/MPS/CRP (6 columns)
    { wch: 20 }, // Manuf PV - Origem
    { wch: 20 }, // Manuf PV - Fórmula
    { wch: 30 }, // Manuf MPS - Critério Cálculo
    { wch: 35 }, // Manuf MPS - Fator Custo Distribuição
    { wch: 20 }, // Manuf CRP - Prioridade
    { wch: 20 }, // Manuf CRP - Programação

    // FROM FISCAL - Gerais (7 columns)
    { wch: 25 }, // Fiscal Gerais - Forma Descrição
    { wch: 25 }, // Fiscal Gerais - Forma Obtenção
    { wch: 30 }, // Fiscal Gerais - Quantidade Fracionada
    { wch: 25 }, // Fiscal Gerais - Lote Múltiplo
    { wch: 30 }, // Fiscal Gerais Unidade Negócio - Código
    { wch: 35 }, // Fiscal Gerais Unidade Negócio - Nome
    { wch: 25 }, // Fiscal Gerais - Origem Unid Trib

    // FROM FISCAL - Complementares (5 columns)
    { wch: 25 }, // Fiscal Compl - Tipo Controle
    { wch: 30 }, // Fiscal Compl - Tipo Controle Estoque
    { wch: 20 }, // Fiscal Compl - Emissão NF
    { wch: 18 }, // Fiscal Compl - Faturável
    { wch: 20 }, // Fiscal Compl - Baixa Estoque

    // FROM FISCAL - Fiscal (20 columns)
    { wch: 15 }, // Fiscal - Serviço
    { wch: 25 }, // Fiscal Classificação - Código
    { wch: 15 }, // Fiscal Classificação - NCM
    { wch: 30 }, // Fiscal Classificação - Nome
    { wch: 25 }, // Fiscal IPI - Código Tributação
    { wch: 15 }, // Fiscal IPI - Alíquota
    { wch: 18 }, // Fiscal IPI - Apuração
    { wch: 15 }, // Fiscal IPI - Suspenso
    { wch: 18 }, // Fiscal IPI - Diferenciado
    { wch: 18 }, // Fiscal IPI - Incentivado
    { wch: 25 }, // Fiscal IPI - Combustível/Solvente
    { wch: 25 }, // Fiscal IPI Família - Código
    { wch: 30 }, // Fiscal IPI Família - Nome
    { wch: 25 }, // Fiscal ICMS - Código Tributação
    { wch: 25 }, // Fiscal ICMS - Fator Reajuste
    { wch: 18 }, // Fiscal ISS - Código
    { wch: 15 }, // Fiscal ISS - Alíquota
    { wch: 25 }, // Fiscal INSS - Serviço Código
    { wch: 15 }, // Fiscal - DCR
    { wch: 15 }, // Fiscal - SEFAZ SP

    // FROM FISCAL - PIS/COFINS (17 columns)
    { wch: 28 }, // Fiscal PIS - Cálculo por Unidade
    { wch: 25 }, // Fiscal PIS - Valor por Unidade
    { wch: 25 }, // Fiscal PIS - Alíquota Origem
    { wch: 18 }, // Fiscal PIS - Alíquota
    { wch: 25 }, // Fiscal PIS - Percentual Redução
    { wch: 25 }, // Fiscal PIS Retenção - Percentual
    { wch: 25 }, // Fiscal PIS Retenção - Origem
    { wch: 30 }, // Fiscal COFINS - Cálculo por Unidade
    { wch: 28 }, // Fiscal COFINS - Valor por Unidade
    { wch: 28 }, // Fiscal COFINS - Alíquota Origem
    { wch: 20 }, // Fiscal COFINS - Alíquota
    { wch: 28 }, // Fiscal COFINS - Percentual Redução
    { wch: 28 }, // Fiscal COFINS Retenção - Percentual
    { wch: 28 }, // Fiscal COFINS Retenção - Origem
    { wch: 28 }, // Fiscal Retenção CSLL - Origem
    { wch: 28 }, // Fiscal Retenção CSLL - Percentual
    { wch: 22 }, // Fiscal - Subst Total NF
  ];

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo Completo');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
};

/**
 * Export catalog data to XLSX format with separate sheets for each category
 * Creates 6 sheets with ALL fields from each data category
 * @param data - Array of complete item data
 * @param filename - Base filename for the export (default: 'catalogo_itens')
 */
export const exportCatalogToXLSXMultiple = (
  data: CompleteItemData[],
  filename: string = 'catalogo_itens'
) => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  const workbook = XLSX.utils.book_new();

  // ===================================================================
  // SHEET 1: RESULTADO (ItemSearchResultItem) - 11 columns
  // ===================================================================
  const searchData = data.map((itemData) => ({
    Código: itemData.item?.itemCodigo ?? '',
    Descrição: itemData.item?.itemDescricao ?? '',
    'Unidade Medida Código': itemData.item?.unidadeMedidaCodigo ?? '',
    'Unidade Medida Descrição': itemData.item?.unidadeMedidaDescricao ?? '',
    'Família Código': itemData.item?.familiaCodigo ?? '',
    'Família Descrição': itemData.item?.familiaDescricao ?? '',
    'Família Comercial Código': itemData.item?.familiaComercialCodigo ?? '',
    'Família Comercial Descrição': itemData.item?.familiaComercialDescricao ?? '',
    'Grupo Estoque Código': itemData.item?.grupoEstoqueCodigo ?? '',
    'Grupo Estoque Descrição': itemData.item?.grupoEstoqueDescricao ?? '',
    GTIN: itemData.item?.gtin ?? '',
  }));
  const wsSearch = XLSX.utils.json_to_sheet(searchData);
  wsSearch['!cols'] = [
    { wch: 15 },
    { wch: 50 },
    { wch: 20 },
    { wch: 30 },
    { wch: 15 },
    { wch: 40 },
    { wch: 25 },
    { wch: 40 },
    { wch: 20 },
    { wch: 40 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsSearch, 'Resultado');

  // ===================================================================
  // SHEET 2: INFORMAÇÕES GERAIS (ItemInformacoesGeraisFlat) - 25 columns
  // ===================================================================
  const infoGeraisData = data.map((itemData) => ({
    Código: itemData.item?.itemCodigo ?? '',
    Descrição: itemData.item?.itemDescricao ?? '',
    'Descrição Resumida': itemData.informacoesGerais?.itemDescricaoResumida ?? '',
    'Descrição Alternativa': itemData.informacoesGerais?.itemDescricaoAlternativa ?? '',
    Narrativa: itemData.informacoesGerais?.itemNarrativa ?? '',
    'Unidade Medida Código': itemData.informacoesGerais?.unidadeMedidaCodigo ?? '',
    'Unidade Medida Descrição': itemData.informacoesGerais?.unidadeMedidaDescricao ?? '',
    Status: itemData.informacoesGerais?.itemStatus ?? '',
    'Data Implantação': itemData.informacoesGerais?.dataImplantacao ?? '',
    'Data Liberação': itemData.informacoesGerais?.dataLiberacao ?? '',
    'Data Obsolescência': itemData.informacoesGerais?.dataObsolescencia ?? '',
    Depósito: itemData.informacoesGerais?.deposito ?? '',
    'Código Localização': itemData.informacoesGerais?.codLocalizacao ?? '',
    Endereço: itemData.informacoesGerais?.endereco ?? '',
    'Estabelecimento Padrão Código': itemData.informacoesGerais?.estabelecimentoPadraoCodigo ?? '',
    'Contenedor Código': itemData.informacoesGerais?.contenedorCodigo ?? '',
    'Contenedor Descrição': itemData.informacoesGerais?.contenedorDescricao ?? '',
    'Família Código': itemData.informacoesGerais?.familiaCodigo ?? '',
    'Família Descrição': itemData.informacoesGerais?.familiaDescricao ?? '',
    'Família Comercial Código': itemData.informacoesGerais?.familiaComercialCodigo ?? '',
    'Família Comercial Descrição': itemData.informacoesGerais?.familiaComercialDescricao ?? '',
    'Grupo Estoque Código': itemData.informacoesGerais?.grupoEstoqueCodigo ?? '',
    'Grupo Estoque Descrição': itemData.informacoesGerais?.grupoEstoqueDescricao ?? '',
    Estabelecimentos:
      itemData.informacoesGerais?.estabelecimentos
        ?.map((e: { codigo: string; nome: string }) => `${e.codigo}-${e.nome}`)
        .join('; ') ?? '',
  }));
  const wsInfoGerais = XLSX.utils.json_to_sheet(infoGeraisData);
  wsInfoGerais['!cols'] = [
    { wch: 15 },
    { wch: 50 },
    { wch: 40 },
    { wch: 40 },
    { wch: 50 },
    { wch: 20 },
    { wch: 30 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 25 },
    { wch: 20 },
    { wch: 30 },
    { wch: 15 },
    { wch: 40 },
    { wch: 25 },
    { wch: 40 },
    { wch: 20 },
    { wch: 40 },
    { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsInfoGerais, 'Informações Gerais');

  // ===================================================================
  // SHEET 3: DIMENSÕES (ItemDimensoes) - 47 columns
  // ===================================================================
  const dimensoesData = data.map((itemData) => ({
    Código: itemData.item?.itemCodigo ?? '',
    Descrição: itemData.item?.itemDescricao ?? '',
    // Peça (4 campos)
    'Peça - Altura': itemData.dimensoes?.peca?.altura ?? '',
    'Peça - Largura': itemData.dimensoes?.peca?.largura ?? '',
    'Peça - Profundidade': itemData.dimensoes?.peca?.profundidade ?? '',
    'Peça - Peso': itemData.dimensoes?.peca?.peso ?? '',
    // Item (9 campos)
    'Item - Peças': itemData.dimensoes?.item?.pecas ?? '',
    'Item Embalagem - Altura': itemData.dimensoes?.item?.embalagem?.altura ?? '',
    'Item Embalagem - Largura': itemData.dimensoes?.item?.embalagem?.largura ?? '',
    'Item Embalagem - Profundidade': itemData.dimensoes?.item?.embalagem?.profundidade ?? '',
    'Item Embalagem - Peso': itemData.dimensoes?.item?.embalagem?.peso ?? '',
    'Item Embalado - Altura': itemData.dimensoes?.item?.embalado?.altura ?? '',
    'Item Embalado - Largura': itemData.dimensoes?.item?.embalado?.largura ?? '',
    'Item Embalado - Profundidade': itemData.dimensoes?.item?.embalado?.profundidade ?? '',
    'Item Embalado - Peso': itemData.dimensoes?.item?.embalado?.peso ?? '',
    // Produto (11 campos)
    'Produto - Itens': itemData.dimensoes?.produto?.itens ?? '',
    'Produto - GTIN13': itemData.dimensoes?.produto?.gtin13 ?? '',
    'Produto Embalagem - Altura': itemData.dimensoes?.produto?.embalagem?.altura ?? '',
    'Produto Embalagem - Largura': itemData.dimensoes?.produto?.embalagem?.largura ?? '',
    'Produto Embalagem - Profundidade': itemData.dimensoes?.produto?.embalagem?.profundidade ?? '',
    'Produto Embalagem - Peso': itemData.dimensoes?.produto?.embalagem?.peso ?? '',
    'Produto Embalado - Altura': itemData.dimensoes?.produto?.embalado?.altura ?? '',
    'Produto Embalado - Largura': itemData.dimensoes?.produto?.embalado?.largura ?? '',
    'Produto Embalado - Profundidade': itemData.dimensoes?.produto?.embalado?.profundidade ?? '',
    'Produto Embalado - Peso': itemData.dimensoes?.produto?.embalado?.peso ?? '',
    // Caixa (7 campos)
    'Caixa - Produtos': itemData.dimensoes?.caixa?.produtos ?? '',
    'Caixa - GTIN14': itemData.dimensoes?.caixa?.gtin14 ?? '',
    'Caixa Embalagem - Sigla': itemData.dimensoes?.caixa?.embalagem?.sigla ?? '',
    'Caixa Embalagem - Altura': itemData.dimensoes?.caixa?.embalagem?.altura ?? '',
    'Caixa Embalagem - Largura': itemData.dimensoes?.caixa?.embalagem?.largura ?? '',
    'Caixa Embalagem - Profundidade': itemData.dimensoes?.caixa?.embalagem?.profundidade ?? '',
    'Caixa Embalagem - Peso': itemData.dimensoes?.caixa?.embalagem?.peso ?? '',
    // Palete (3 campos)
    'Palete - Lastro': itemData.dimensoes?.palete?.lastro ?? '',
    'Palete - Camadas': itemData.dimensoes?.palete?.camadas ?? '',
    'Palete - Caixas por Palete': itemData.dimensoes?.palete?.caixasPalete ?? '',
  }));
  const wsDimensoes = XLSX.utils.json_to_sheet(dimensoesData);
  wsDimensoes['!cols'] = [
    { wch: 15 },
    { wch: 50 },
    // Peça
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    // Item
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    // Produto
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 20 },
    // Caixa
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    // Palete
    { wch: 15 },
    { wch: 15 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsDimensoes, 'Dimensões');

  // ===================================================================
  // SHEET 4: PLANEJAMENTO (EstabelecimentoPlanejamento[0]) - 62+ columns
  // ===================================================================
  const planejamentoData = data.map((itemData) => {
    const estab = itemData.planejamento?.item?.estabelecimento?.[0];
    return {
      Código: itemData.item?.itemCodigo ?? '',
      Descrição: itemData.item?.itemDescricao ?? '',
      'Estabelecimento Código': estab?.codigo ?? '',
      'Estabelecimento Nome': estab?.nome ?? '',
      // Produção 1 (11 campos)
      'Prod1 - Depósito Padrão': estab?.producao1?.depositoPadrao ?? '',
      'Prod1 - Localização': estab?.producao1?.localizacao ?? '',
      'Prod1 - Status': estab?.producao1?.status ?? '',
      'Prod1 Planejador - Código': estab?.producao1?.planejador?.codigo ?? '',
      'Prod1 Planejador - Nome': estab?.producao1?.planejador?.nome ?? '',
      'Prod1 Linha Produção - Código': estab?.producao1?.linhaProducao?.codigo ?? '',
      'Prod1 Linha Produção - Nome': estab?.producao1?.linhaProducao?.nome ?? '',
      'Prod1 Chão Fábrica - Capacidade': estab?.producao1?.chaoDeFabrica?.capacidadeEstoque ?? '',
      'Prod1 Chão Fábrica - Considera Aloc Atividades':
        estab?.producao1?.chaoDeFabrica?.consideraAlocAtividades ?? '',
      'Prod1 Chão Fábrica - Programa Aloc Atividades':
        estab?.producao1?.chaoDeFabrica?.programaAlocAtividades ?? '',
      'Prod1 Chão Fábrica - Percentual Overlap':
        estab?.producao1?.chaoDeFabrica?.percentualOverlap ?? '',
      // Produção 2 (14 campos)
      'Prod2 - Reporta MOB': estab?.producao2?.reportaMOB ?? '',
      'Prod2 - Reporta GGF': estab?.producao2?.reportaGGF ?? '',
      'Prod2 - Tipo Alocação': estab?.producao2?.tipoAlocacao ?? '',
      'Prod2 - Tipo Requisição': estab?.producao2?.tipoRequisicao ?? '',
      'Prod2 - Processo Custos': estab?.producao2?.processoCustos ?? '',
      'Prod2 - Reporte Produção': estab?.producao2?.reporteProducao ?? '',
      'Prod2 Refugo - Tratamento': estab?.producao2?.refugo?.tratamentoRefugo ?? '',
      'Prod2 Refugo - Controla Estoque': estab?.producao2?.refugo?.controlaEstoque ?? '',
      'Prod2 Refugo - Preço Fiscal': estab?.producao2?.refugo?.precoFiscal ?? '',
      'Prod2 Refugo Item - Código': estab?.producao2?.refugo?.item?.codigo ?? '',
      'Prod2 Refugo Item - Descrição': estab?.producao2?.refugo?.item?.descricao ?? '',
      'Prod2 Refugo - Relação Item': estab?.producao2?.refugo?.relacaoItem ?? '',
      'Prod2 Refugo - Fator': estab?.producao2?.refugo?.fator ?? '',
      'Prod2 Refugo - Perda': estab?.producao2?.refugo?.perda ?? '',
      // Reposição (10 campos)
      'Reposição - Política': estab?.reposicao?.politica ?? '',
      'Reposição - Tipo Demanda': estab?.reposicao?.tipoDemanda ?? '',
      'Reposição Lote - Múltiplo': estab?.reposicao?.lote?.multiplo ?? '',
      'Reposição Lote - Mínimo': estab?.reposicao?.lote?.minimo ?? '',
      'Reposição Lote - Econômico': estab?.reposicao?.lote?.economico ?? '',
      'Reposição Lote - Período Fixo': estab?.reposicao?.lote?.periodoFixo ?? '',
      'Reposição Lote - Ponto Reposição': estab?.reposicao?.lote?.pontoReposicao ?? '',
      'Reposição Est Segurança - Tipo': estab?.reposicao?.estoqueSeguranca?.tipo ?? '',
      'Reposição Est Segurança - Valor': estab?.reposicao?.estoqueSeguranca?.valor ?? '',
      'Reposição Est Segurança - Converte Tempo':
        estab?.reposicao?.estoqueSeguranca?.converteTempo ?? '',
      // MRP (14 campos)
      'MRP - Classe Reprogramação': estab?.mrp?.classeReprogramacao ?? '',
      'MRP - Emissão Ordens': estab?.mrp?.emissaoOrdens ?? '',
      'MRP - Divisão Ordens': estab?.mrp?.divisaoOrdens ?? '',
      'MRP - Prioridade': estab?.mrp?.prioridade ?? '',
      'MRP Ressup Compras - Quantidade': estab?.mrp?.ressuprimento?.compras?.quantidade ?? '',
      'MRP Ressup Compras - Fornecedor': estab?.mrp?.ressuprimento?.compras?.fornecedor ?? '',
      'MRP Ressup Compras - Qualidade': estab?.mrp?.ressuprimento?.compras?.qualidade ?? '',
      'MRP Ressup Fábrica - Quantidade': estab?.mrp?.ressuprimento?.fabrica?.quantidade ?? '',
      'MRP Ressup Fábrica - Qualidade': estab?.mrp?.ressuprimento?.fabrica?.qualidade ?? '',
      'MRP Ressup Fábrica - Mínimo': estab?.mrp?.ressuprimento?.fabrica?.minimo ?? '',
      'MRP Ressup Fábrica Variação - Tempo':
        estab?.mrp?.ressuprimento?.fabrica?.variacao?.tempo ?? '',
      'MRP Ressup Fábrica Variação - Quantidade':
        estab?.mrp?.ressuprimento?.fabrica?.variacao?.quantidade ?? '',
    };
  });
  const wsPlanejamento = XLSX.utils.json_to_sheet(planejamentoData);
  wsPlanejamento['!cols'] = [
    { wch: 15 },
    { wch: 50 },
    { wch: 20 },
    { wch: 30 },
    // Prod1
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 30 },
    { wch: 25 },
    { wch: 30 },
    { wch: 25 },
    { wch: 30 },
    { wch: 30 },
    { wch: 25 },
    // Prod2
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 25 },
    { wch: 30 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    // Reposição
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 22 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 30 },
    // MRP
    { wch: 25 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 30 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsPlanejamento, 'Planejamento');

  // ===================================================================
  // SHEET 5: MANUFATURA (ItemManufatura) - 50+ columns
  // ===================================================================
  const manufaturaData = data.map((itemData) => ({
    Código: itemData.item?.itemCodigo ?? '',
    Descrição: itemData.item?.itemDescricao ?? '',
    // Gerais (7 campos)
    'Gerais - Situação': itemData.manufatura?.item?.gerais?.situacao ?? '',
    'Gerais - Tipo Controle': itemData.manufatura?.item?.gerais?.tipoControle ?? '',
    'Gerais - Tipo Controle Estoque': itemData.manufatura?.item?.gerais?.tipoControleEstoque ?? '',
    'Gerais - Tipo Requisição': itemData.manufatura?.item?.gerais?.tipoRequisicao ?? '',
    'Gerais - Considera Alocação Atividades':
      itemData.manufatura?.item?.gerais?.consideraAlocacaoAtividades ?? '',
    'Gerais - Programa Alocação Atividades':
      itemData.manufatura?.item?.gerais?.programaAlocacaoAtividades ?? '',
    'Gerais - Taxa Overlap': itemData.manufatura?.item?.gerais?.taxaOverlap ?? '',
    // Reposição (14 campos)
    'Reposição - Política': itemData.manufatura?.item?.reposicao?.politica ?? '',
    'Reposição - Tipo Demanda': itemData.manufatura?.item?.reposicao?.tipoDemanda ?? '',
    'Reposição Lote - Múltiplo': itemData.manufatura?.item?.reposicao?.lote?.multiplo ?? '',
    'Reposição Lote - Mínimo': itemData.manufatura?.item?.reposicao?.lote?.minimo ?? '',
    'Reposição Lote - Econômico': itemData.manufatura?.item?.reposicao?.lote?.economico ?? '',
    'Reposição Est Segurança - Tipo':
      itemData.manufatura?.item?.reposicao?.estoqueSeguranca?.tipo ?? '',
    'Reposição Est Segurança - Quantidade':
      itemData.manufatura?.item?.reposicao?.estoqueSeguranca?.quantidade ?? '',
    'Reposição Est Segurança - Tempo':
      itemData.manufatura?.item?.reposicao?.estoqueSeguranca?.tempo ?? '',
    'Reposição Est Segurança - Converte Tempo':
      itemData.manufatura?.item?.reposicao?.estoqueSeguranca?.converteTempo ?? '',
    'Reposição Est Segurança - Reabastecimento':
      itemData.manufatura?.item?.reposicao?.estoqueSeguranca?.reabastecimento ?? '',
    'Reposição - Período Fixo': itemData.manufatura?.item?.reposicao?.periodoFixo ?? '',
    'Reposição - Ponto Reposição': itemData.manufatura?.item?.reposicao?.pontoReposicao ?? '',
    'Reposição - Fator Refugo': itemData.manufatura?.item?.reposicao?.fatorRefugo ?? '',
    'Reposição - Quantidade Perda': itemData.manufatura?.item?.reposicao?.quantidadePerda ?? '',
    // MRP (16 campos)
    'MRP - Classe Reprogramação': itemData.manufatura?.item?.mrp?.classeReprogramacao ?? '',
    'MRP - Emissão Ordens': itemData.manufatura?.item?.mrp?.emissaoOrdens ?? '',
    'MRP - Controle Planejamento': itemData.manufatura?.item?.mrp?.controlePlanejamento ?? '',
    'MRP - Divisão Ordens': itemData.manufatura?.item?.mrp?.divisaoOrdens ?? '',
    'MRP - Processo': itemData.manufatura?.item?.mrp?.processo ?? '',
    'MRP - Represa Demanda': itemData.manufatura?.item?.mrp?.represaDemanda ?? '',
    'MRP Ressup - Compras': itemData.manufatura?.item?.mrp?.ressuprimento?.compras ?? '',
    'MRP Ressup - Fornecedor': itemData.manufatura?.item?.mrp?.ressuprimento?.fornecedor ?? '',
    'MRP Ressup - Qualidade': itemData.manufatura?.item?.mrp?.ressuprimento?.qualidade ?? '',
    'MRP Ressup - Fábrica': itemData.manufatura?.item?.mrp?.ressuprimento?.fabrica ?? '',
    'MRP Ressup - Fábrica Qualidade':
      itemData.manufatura?.item?.mrp?.ressuprimento?.fabricaQualidade ?? '',
    'MRP Ressup - Mínimo': itemData.manufatura?.item?.mrp?.ressuprimento?.minimo ?? '',
    'MRP Ressup - Variação Tempo':
      itemData.manufatura?.item?.mrp?.ressuprimento?.variacaoTempo ?? '',
    'MRP Ressup - Quantidade': itemData.manufatura?.item?.mrp?.ressuprimento?.quantidade ?? '',
    'MRP Ressup - Horizonte Liberação':
      itemData.manufatura?.item?.mrp?.ressuprimento?.horizonteLiberacao ?? '',
    'MRP Ressup - Horizonte Fixo':
      itemData.manufatura?.item?.mrp?.ressuprimento?.horizonteFixo ?? '',
    // PV/MPS/CRP (6 campos)
    'PV - Origem': itemData.manufatura?.item?.pvMpsCrp?.pV?.origem ?? '',
    'PV - Fórmula': itemData.manufatura?.item?.pvMpsCrp?.pV?.formula ?? '',
    'MPS - Critério Cálculo': itemData.manufatura?.item?.pvMpsCrp?.MPS?.criterioCalculo ?? '',
    'MPS - Fator Custo Distribuição':
      itemData.manufatura?.item?.pvMpsCrp?.MPS?.fatorCustoDistribuicao ?? '',
    'CRP - Prioridade': itemData.manufatura?.item?.pvMpsCrp?.CRP?.prioridade ?? '',
    'CRP - Programação': itemData.manufatura?.item?.pvMpsCrp?.CRP?.programacao ?? '',
  }));
  const wsManufatura = XLSX.utils.json_to_sheet(manufaturaData);
  wsManufatura['!cols'] = [
    { wch: 15 },
    { wch: 50 },
    // Gerais
    { wch: 20 },
    { wch: 25 },
    { wch: 28 },
    { wch: 25 },
    { wch: 32 },
    { wch: 32 },
    { wch: 20 },
    // Reposição
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 28 },
    { wch: 30 },
    { wch: 28 },
    { wch: 30 },
    { wch: 30 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    // MRP
    { wch: 28 },
    { wch: 25 },
    { wch: 28 },
    { wch: 25 },
    { wch: 20 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 28 },
    { wch: 25 },
    { wch: 28 },
    { wch: 25 },
    { wch: 28 },
    { wch: 28 },
    // PV/MPS/CRP
    { wch: 20 },
    { wch: 20 },
    { wch: 28 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsManufatura, 'Manufatura');

  // ===================================================================
  // SHEET 6: FISCAL (ItemFiscal) - 60+ columns
  // ===================================================================
  const fiscalData = data.map((itemData) => ({
    Código: itemData.item?.itemCodigo ?? '',
    Descrição: itemData.item?.itemDescricao ?? '',
    // Gerais (7 campos)
    'Gerais - Forma Descrição': itemData.fiscal?.item?.gerais?.formaDescricao ?? '',
    'Gerais - Forma Obtenção': itemData.fiscal?.item?.gerais?.formaObtencao ?? '',
    'Gerais - Quantidade Fracionada': itemData.fiscal?.item?.gerais?.quantidadeFracionada ?? '',
    'Gerais - Lote Múltiplo': itemData.fiscal?.item?.gerais?.loteMultiplo ?? '',
    'Gerais Unidade Negócio - Código': itemData.fiscal?.item?.gerais?.unidadeNegocio?.codigo ?? '',
    'Gerais Unidade Negócio - Nome': itemData.fiscal?.item?.gerais?.unidadeNegocio?.nome ?? '',
    'Gerais - Origem Unid Trib': itemData.fiscal?.item?.gerais?.origemUnidTrib ?? '',
    // Complementares (5 campos)
    'Compl - Tipo Controle': itemData.fiscal?.item?.complementares?.tipoControle ?? '',
    'Compl - Tipo Controle Estoque':
      itemData.fiscal?.item?.complementares?.tipoControleEstoque ?? '',
    'Compl - Emissão NF': itemData.fiscal?.item?.complementares?.emissaoNF ?? '',
    'Compl - Faturável': itemData.fiscal?.item?.complementares?.faturavel ?? '',
    'Compl - Baixa Estoque': itemData.fiscal?.item?.complementares?.baixaEstoque ?? '',
    // Fiscal (20 campos)
    'Fiscal - Serviço': itemData.fiscal?.item?.fiscal?.servico ?? '',
    'Fiscal Classificação - Código': itemData.fiscal?.item?.fiscal?.classificacao?.codigo ?? '',
    'Fiscal Classificação - NCM': itemData.fiscal?.item?.fiscal?.classificacao?.ncm ?? '',
    'Fiscal Classificação - Nome': itemData.fiscal?.item?.fiscal?.classificacao?.nome ?? '',
    'Fiscal IPI - Código Tributação': itemData.fiscal?.item?.fiscal?.ipi?.codigoTributacao ?? '',
    'Fiscal IPI - Alíquota': itemData.fiscal?.item?.fiscal?.ipi?.aliquota ?? '',
    'Fiscal IPI - Apuração': itemData.fiscal?.item?.fiscal?.ipi?.apuracao ?? '',
    'Fiscal IPI - Suspenso': itemData.fiscal?.item?.fiscal?.ipi?.suspenso ?? '',
    'Fiscal IPI - Diferenciado': itemData.fiscal?.item?.fiscal?.ipi?.diferenciado ?? '',
    'Fiscal IPI - Incentivado': itemData.fiscal?.item?.fiscal?.ipi?.incentivado ?? '',
    'Fiscal IPI - Combustível/Solvente':
      itemData.fiscal?.item?.fiscal?.ipi?.combustivelSolvente ?? '',
    'Fiscal IPI Família - Código': itemData.fiscal?.item?.fiscal?.ipi?.familia?.codigo ?? '',
    'Fiscal IPI Família - Nome': itemData.fiscal?.item?.fiscal?.ipi?.familia?.nome ?? '',
    'Fiscal ICMS - Código Tributação': itemData.fiscal?.item?.fiscal?.icms?.codigoTributacao ?? '',
    'Fiscal ICMS - Fator Reajuste': itemData.fiscal?.item?.fiscal?.icms?.fatorReajuste ?? '',
    'Fiscal ISS - Código': itemData.fiscal?.item?.fiscal?.iss?.codigo ?? '',
    'Fiscal ISS - Alíquota': itemData.fiscal?.item?.fiscal?.iss?.aliquota ?? '',
    'Fiscal INSS - Serviço Código': itemData.fiscal?.item?.fiscal?.inss?.servicoCodigo ?? '',
    'Fiscal - DCR': itemData.fiscal?.item?.fiscal?.DCR ?? '',
    'Fiscal - SEFAZ SP': itemData.fiscal?.item?.fiscal?.sefazSP ?? '',
    // PIS/COFINS (17 campos)
    'PIS - Cálculo por Unidade': itemData.fiscal?.item?.pisCofins?.pis?.calculoPorUnidade ?? '',
    'PIS - Valor por Unidade': itemData.fiscal?.item?.pisCofins?.pis?.valorPorUnidade ?? '',
    'PIS - Alíquota Origem': itemData.fiscal?.item?.pisCofins?.pis?.aliquotaOrigem ?? '',
    'PIS - Alíquota': itemData.fiscal?.item?.pisCofins?.pis?.aliquota ?? '',
    'PIS - Percentual Redução': itemData.fiscal?.item?.pisCofins?.pis?.percentualReducao ?? '',
    'PIS Retenção - Percentual': itemData.fiscal?.item?.pisCofins?.pis?.retencao?.percentual ?? '',
    'PIS Retenção - Origem': itemData.fiscal?.item?.pisCofins?.pis?.retencao?.origem ?? '',
    'COFINS - Cálculo por Unidade':
      itemData.fiscal?.item?.pisCofins?.cofins?.calculoPorUnidade ?? '',
    'COFINS - Valor por Unidade': itemData.fiscal?.item?.pisCofins?.cofins?.valorPorUnidade ?? '',
    'COFINS - Alíquota Origem': itemData.fiscal?.item?.pisCofins?.cofins?.aliquotaOrigem ?? '',
    'COFINS - Alíquota': itemData.fiscal?.item?.pisCofins?.cofins?.aliquota ?? '',
    'COFINS - Percentual Redução':
      itemData.fiscal?.item?.pisCofins?.cofins?.percentualReducao ?? '',
    'COFINS Retenção - Percentual':
      itemData.fiscal?.item?.pisCofins?.cofins?.retencao?.percentual ?? '',
    'COFINS Retenção - Origem': itemData.fiscal?.item?.pisCofins?.cofins?.retencao?.origem ?? '',
    'Retenção CSLL - Origem': itemData.fiscal?.item?.pisCofins?.retencaoCsll?.origem ?? '',
    'Retenção CSLL - Percentual': itemData.fiscal?.item?.pisCofins?.retencaoCsll?.percentual ?? '',
    'Subst Total NF': itemData.fiscal?.item?.pisCofins?.substTotalNF ?? '',
  }));
  const wsFiscal = XLSX.utils.json_to_sheet(fiscalData);
  wsFiscal['!cols'] = [
    { wch: 15 },
    { wch: 50 },
    // Gerais
    { wch: 25 },
    { wch: 25 },
    { wch: 28 },
    { wch: 25 },
    { wch: 28 },
    { wch: 32 },
    { wch: 25 },
    // Complementares
    { wch: 25 },
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    // Fiscal
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 30 },
    { wch: 25 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 25 },
    { wch: 25 },
    { wch: 30 },
    { wch: 25 },
    { wch: 25 },
    { wch: 18 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    // PIS/COFINS
    { wch: 26 },
    { wch: 24 },
    { wch: 24 },
    { wch: 18 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 28 },
    { wch: 26 },
    { wch: 26 },
    { wch: 20 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsFiscal, 'Fiscal');

  // Generate filename with timestamp and save
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
};
