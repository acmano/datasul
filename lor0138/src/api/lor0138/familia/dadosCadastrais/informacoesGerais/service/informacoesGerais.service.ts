// src/api/lor0138/familia/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts

import { FamiliaInformacoesGeraisRepository } from '../repository/informacoesGerais.repository';
import { DatabaseError, FamiliaNotFoundError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';

/**
 * Service - Informações Gerais da Família
 * @module InformacoesGeraisService
 * @category Services
 */
export class InformacoesGeraisService {
  /**
   * Busca informações completas de uma família
   */
  static async getInformacoesGerais(familiaCodigo: string): Promise<any | null> {
    try {
      // Buscar dados mestres da família
      const familiaData = await FamiliaInformacoesGeraisRepository.getFamiliaMaster(familiaCodigo);

      // Verificar existência da família
      if (!familiaData) {
        log.info('Família não encontrada', { familiaCodigo });
        throw new FamiliaNotFoundError(familiaCodigo);
      }

      // Montar DTO de resposta
      const response = {
        identificacaoFamiliaCodigo: familiaData.familiaCodigo,
        identificacaoFamiliaDescricao: familiaData.familiaDescricao,
      };

      return response;

    } catch (error) {
      // Erro de família não encontrada
      if (error instanceof FamiliaNotFoundError) {
        throw error;
      }

      // Erro de banco de dados ou desconhecido
      log.error('Erro ao buscar informações gerais', {
        familiaCodigo,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      throw new DatabaseError(
        'Falha ao buscar informações da família',
        error instanceof Error ? error : undefined
      );
    }
  }
}