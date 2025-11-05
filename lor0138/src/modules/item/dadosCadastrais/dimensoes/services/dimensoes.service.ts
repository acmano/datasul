// src/modules/item/dadosCadastrais/informacoesGerais/services/itemDimensoes.service.ts

import api from '../../../../../shared/config/api.config';
import { ItemDimensoes } from '../types';

export const dimensoesService = {
  async getByCode(code: string): Promise<ItemDimensoes | null> {
    try {
      // console.log(`[ItemDimensoesService] Buscando dimensões para código: ${code}`);

      const response = await api.get(`/api/item/dadosCadastrais/dimensoes/${code}`, {
        timeout: 30000,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (response.data && response.data.success && response.data.data) {
        // console.log(`[ItemDimensoesService] Dimensões encontradas para ${code}`);
        return response.data.data;
      }

      // console.log(`[ItemDimensoesService] Nenhuma dimensão encontrada para ${code}`);
      return null;
    } catch (error: any) {
      console.error('[ItemDimensoesService] Erro ao buscar dimensões do item:', error);

      // Propagar erro com mensagem apropriada
      if (error.response?.status === 404) {
        throw new Error('Dimensões não encontradas para este item');
      }

      throw error;
    }
  },
};
