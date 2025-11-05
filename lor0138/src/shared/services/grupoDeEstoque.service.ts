import api from '../config/api.config';

export interface GrupoDeEstoque {
  codigo: string;
  descricao: string;
}

export const grupoDeEstoqueService = {
  async getAll(): Promise<GrupoDeEstoque[]> {
    const response = await api.get('/api/grupoDeEstoque');
    return response.data.data || [];
  },
};
