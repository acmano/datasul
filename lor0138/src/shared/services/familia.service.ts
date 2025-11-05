import api from '../config/api.config';

export interface Familia {
  codigo: string;
  descricao: string;
}

export const familiaService = {
  async getAll(): Promise<Familia[]> {
    const response = await api.get('/api/familia');
    return response.data.data || [];
  },
};
