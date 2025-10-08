// src/api/lor0138/grupoDeEstoque/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts

import { GrupoDeEstoqueInformacoesGeraisRepository } from '../repository/informacoesGerais.repository';
import { DatabaseError, GrupoDeEstoqueNotFoundError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';

/**
 * Service - Informações Gerais do Grupo de Estoque
 * @module InformacoesGeraisService
 * @category Services
 */
export class InformacoesGeraisService {
  /**
   * Busca informações completas de um grupo de estoque
   */
  static async getInformacoesGerais(grupoDeEstoqueCodigo: string): Promise<any | null> {
    try {
      // Buscar dados mestres do grupo de estoque
      const grupoDeEstoqueData = await GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster(grupoDeEstoqueCodigo);

      // Verificar existência do grupo de estoque
      if (!grupoDeEstoqueData) {
        log.info('Grupo não encontrado', { grupoDeEstoqueCodigo });
        throw new GrupoDeEstoqueNotFoundError(grupoDeEstoqueCodigo);
      }

      // Montar DTO de resposta
      const response = {
        identificacaoGrupoDeEstoqueCodigo: grupoDeEstoqueData.grupoCodigo,
        identificacaoGrupoDeEstoqueDescricao: grupoDeEstoqueData.grupoDescricao,
      };

      return response;

    } catch (error) {
      // Erro de grupo de estoque não encontrado
      if (error instanceof GrupoDeEstoqueNotFoundError) {
        throw error;
      }

      // Erro de banco de dados ou desconhecido
      log.error('Erro ao buscar informações gerais', {
        grupoDeEstoqueCodigo,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      throw new DatabaseError(
        'Falha ao buscar informações do grupo de estoque',
        error instanceof Error ? error : undefined
      );
    }
  }
}