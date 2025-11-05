// src/modules/item/dadosCadastrais/informacoesGerais/services/itemInformacoesGerais.service.ts

import api from '../../../../../shared/config/api.config';
import { ItemInformacoesGeraisApiResponse, ItemInformacoesGeraisFlat } from '../types';

// Configuração de retry
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000,
  timeoutMs: 30000,
};

/**
 * Converte resposta aninhada da API para formato flat
 */
const mapApiToFlat = (
  apiData: ItemInformacoesGeraisApiResponse['data']
): ItemInformacoesGeraisFlat => {
  return {
    // Dados principais
    itemCodigo: apiData.item.codigo,
    itemDescricao: apiData.item.descricao,
    itemDescricaoResumida: apiData.item.descricaoResumida,
    itemDescricaoAlternativa: apiData.item.descricaoAlternativa,
    itemNarrativa: apiData.item.itemNarrativa?.trim() || undefined,

    // Unidade
    unidadeMedidaCodigo: apiData.item.unidade,
    unidadeMedidaDescricao: apiData.item.unidade,

    // Status e datas
    itemStatus: apiData.item.status,
    dataImplantacao: apiData.item.dataImplantacao,
    dataLiberacao: apiData.item.dataLiberacao,
    dataObsolescencia: apiData.item.dataObsolescencia,

    // Localização
    deposito: apiData.item.deposito,
    codLocalizacao: apiData.item.codLocalizacao,
    endereco: apiData.item.endereco,
    estabelecimentoPadraoCodigo: apiData.item.estabelecimentoPadraoCodigo,

    // Contenedor
    contenedorCodigo: apiData.item.contenedor?.codigo,
    contenedorDescricao: apiData.item.contenedor?.descricao,

    // Classificações (API retorna direto no item, sem objetos aninhados)
    // IMPORTANTE: API não retorna descrições, apenas códigos
    familiaCodigo: (apiData.item as any).familiaCodigo || '',
    familiaDescricao: '', // API não retorna descrição
    familiaComercialCodigo: (apiData.item as any).familiaComercialCodigo || '',
    familiaComercialDescricao: '', // API não retorna descrição
    grupoEstoqueCodigo: (apiData.item as any).grupoDeEstoqueCodigo?.toString() || '',
    grupoEstoqueDescricao: '', // API não retorna descrição

    // Estabelecimentos
    estabelecimentos: apiData.estabelecimentos || [],
  };
};

/**
 * Service para buscar informações gerais do item
 */
export const itemInformacoesGeraisService = {
  /**
   * Busca dados cadastrais base de um item pelo código
   * @param codigo - Código do item
   * @returns Promise com dados no formato flat
   */
  async getByCode(codigo: string): Promise<ItemInformacoesGeraisFlat> {
    let lastError: any;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RETRY_CONFIG.timeoutMs);

        const response = await api.get<ItemInformacoesGeraisApiResponse>(
          `/api/item/dadosCadastrais/informacoesGerais/${codigo}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        // Verificar sucesso
        if (!response.data.success || !response.data.data) {
          throw new Error('Dados não encontrados na resposta da API');
        }

        // Converter para formato flat
        return mapApiToFlat(response.data.data);
      } catch (error: any) {
        lastError = error;

        if (error.name === 'AbortError') {
          console.warn(`Tentativa ${attempt + 1} timeout após ${RETRY_CONFIG.timeoutMs}ms`);
        } else if (error.response) {
          // Erro HTTP - não fazer retry
          throw new Error(
            `Erro ao buscar item ${codigo}: ${error.response.status} - ${
              error.response.data?.message || error.message
            }`
          );
        }

        // Aguardar antes de tentar novamente
        if (attempt < RETRY_CONFIG.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_CONFIG.retryDelay));
        }
      }
    }

    throw new Error(
      `Falha ao buscar item ${codigo} após ${RETRY_CONFIG.maxRetries + 1} tentativas: ${
        lastError?.message || 'Erro desconhecido'
      }`
    );
  },
};
