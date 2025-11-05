// src/modules/manufatura/base/services/manufatura.service.ts

import api from '../../../../shared/config/api.config';
import { ItemManufatura } from '../types';

export const manufaturaService = {
  async getByCode(code: string): Promise<ItemManufatura | null> {
    try {
      // console.log(`[ManufaturaService] Buscando manufatura para código: ${code}`);

      const response = await api.get(`/api/item/dadosCadastrais/manufatura/${code}`, {
        timeout: 30000,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (response.data && response.data.success && response.data.data) {
        // console.log(`[ManufaturaService] Manufatura encontrada para ${code}`);
        return response.data.data;
      }

      // console.log(`[ManufaturaService] Nenhuma manufatura encontrada para ${code}`);
      return null;
    } catch (error: any) {
      console.error('[ManufaturaService] Erro ao buscar manufatura do item:', error);

      if (error.response?.status === 404) {
        throw new Error('Manufatura não encontrada para este item');
      }

      throw error;
    }
  },
};
