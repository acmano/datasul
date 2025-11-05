// src/modules/fiscal/base/services/fiscal.service.ts

import api from '../../../../shared/config/api.config';
import { ItemFiscal } from '../types';

export const fiscalService = {
  async getByCode(code: string): Promise<ItemFiscal | null> {
    try {
      // console.log(`[FiscalService] Buscando dados fiscais para código: ${code}`);

      const response = await api.get(`/api/item/dadosCadastrais/fiscal/${code}`, {
        timeout: 30000,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (response.data && response.data.success && response.data.data) {
        // console.log(`[FiscalService] Dados fiscais encontrados para ${code}`);
        return response.data.data;
      }

      // console.log(`[FiscalService] Nenhum dado fiscal encontrado para ${code}`);
      return null;
    } catch (error: any) {
      console.error('[FiscalService] Erro ao buscar dados fiscais do item:', error);

      if (error.response?.status === 404) {
        throw new Error('Dados fiscais não encontrados para este item');
      }

      throw error;
    }
  },
};
