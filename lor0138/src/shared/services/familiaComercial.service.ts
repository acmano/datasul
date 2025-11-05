import api from '../config/api.config';

export interface FamiliaComercial {
  codigo: string;
  descricao: string;
}

export const familiaComercialService = {
  async getAll(): Promise<FamiliaComercial[]> {
    const response = await api.get('/api/familiaComercial');
    return response.data.data || [];
  },
};
