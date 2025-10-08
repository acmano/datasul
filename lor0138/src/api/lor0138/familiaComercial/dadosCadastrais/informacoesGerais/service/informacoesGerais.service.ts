// src/api/lor0138/familia/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts

import { FamiliaComercialInformacoesGeraisRepository } from '../repository/informacoesGerais.repository';
import { DatabaseError, FamiliaComercialNotFoundError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';

/**
 * Service - Informações Gerais da Família Comercial
 * @module InformacoesGeraisService
 * @category Services
 */
export class InformacoesGeraisService {
  /**
   * Busca informações completas de uma família comercial
   */
  static async getInformacoesGerais(familiaComercialCodigo: string): Promise<any | null> {
    try {
      // Buscar dados mestres da família comercial
      const familiaComercialData = await FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster(familiaComercialCodigo);

      // Verificar existência da família comercial
      if (!familiaComercialData) {
        log.info('Família comercial não encontrada', { familiaComercialCodigo });
        throw new FamiliaComercialNotFoundError(familiaComercialCodigo);
      }

      // Montar DTO de resposta
      const response = {
        identificacaoFamiliaComercialCodigo: familiaComercialData.familiaComercialCodigo,
        identificacaoFamiliaComercialDescricao: familiaComercialData.familiaComercialDescricao,
      };

      return response;

    } catch (error) {
      // Erro de família comercial não encontrada
      if (error instanceof FamiliaComercialNotFoundError) {
        throw error;
      }

      // Erro de banco de dados ou desconhecido
      log.error('Erro ao buscar informações gerais', {
        familiaComercialCodigo,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      throw new DatabaseError(
        'Falha ao buscar informações da família comercial',
        error instanceof Error ? error : undefined
      );
    }
  }
}