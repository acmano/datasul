// src/modules/pcp/base/planejamento/services/planejamento.service.ts

import api from '../../../../../shared/config/api.config';
import { ItemPlanejamento } from '../types';

export const planejamentoService = {
  async getByCode(code: string): Promise<ItemPlanejamento | null> {
    try {
      // console.log(`[PlanejamentoService] Buscando planejamento para código: ${code}`);

      const response = await api.get(`/api/item/dadosCadastrais/planejamento/${code}`, {
        timeout: 30000,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (response.data && response.data.success && response.data.data) {
        // console.log(`[PlanejamentoService] Planejamento encontrado para ${code}`);
        return response.data.data;
      }

      // console.log(`[PlanejamentoService] Nenhum planejamento encontrado para ${code}`);
      return null;
    } catch (error: any) {
      console.error('[PlanejamentoService] Erro ao buscar planejamento do item:', error);

      if (error.response?.status === 404) {
        throw new Error('Planejamento não encontrado para este item');
      }

      throw error;
    }
  },
};
