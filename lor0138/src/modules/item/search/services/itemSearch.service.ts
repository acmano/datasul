import api from '../../../../shared/config/api.config';
import { ItemSearchFilters, ItemSearchResponse } from '../types/search.types';

export const itemSearchService = {
  async search(filters: ItemSearchFilters): Promise<ItemSearchResponse> {
    // Mapear campos do frontend para o formato esperado pelo backend
    const backendFilters: any = {};

    if (filters.itemCodigo) {
      backendFilters.codigo = filters.itemCodigo;
    }
    if (filters.itemDescricao) {
      backendFilters.descricao = filters.itemDescricao;
    }
    if (filters.familiaCodigo) {
      backendFilters.familia = filters.familiaCodigo;
    }
    if (filters.familiaComercialCodigo) {
      backendFilters.familiaComercial = filters.familiaComercialCodigo;
    }
    if (filters.grupoEstoqueCodigo) {
      backendFilters.grupoEstoque = filters.grupoEstoqueCodigo;
    }
    if (filters.tipoItem && filters.tipoItem.length > 0) {
      backendFilters.tipoItem = filters.tipoItem;
    }
    if (filters.gtin) {
      backendFilters.gtin = filters.gtin;
    }
    if (filters.limite) {
      backendFilters.limite = filters.limite;
    }

    const response = await api.get('/api/item/search', { params: backendFilters });

    // Backend retorna: { data: [{ item: {...} }], total: 1 }
    // Precisamos transformar para: { items: [...], total: 1 }
    const backendData = response.data.data || [];
    const items = backendData.map((record: any) => ({
      itemCodigo: record.item.codigo,
      itemDescricao: record.item.descricao,
      unidadeMedidaCodigo: record.item.unidade,
      familiaCodigo: record.item.familia?.codigo,
      familiaDescricao: record.item.familia?.descricao,
      familiaComercialCodigo: record.item.familiaComercial?.codigo,
      familiaComercialDescricao: record.item.familiaComercial?.descricao,
      grupoEstoqueCodigo: record.item.grupoDeEstoque?.codigo,
      grupoEstoqueDescricao: record.item.grupoDeEstoque?.descricao,
      codObsoleto: 0,
      gtin: record.item.gtin13 || record.item.gtin14,
      tipo: record.item.tipo,
    }));

    return {
      items,
      total: response.data.total || 0,
    };
  },
};
