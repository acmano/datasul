// src/api/lor0138/estabelecimento/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts

import { EstabelecimentoInformacoesGeraisRepository } from '../repository/informacoesGerais.repository';
import { DatabaseError, EstabelecimentoNotFoundError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';

/**
 * Service - Informações Gerais do Estabelecimento
 */
export class InformacoesGeraisService {
  
  /**
   * Busca informações do estabelecimento
   */
  static async getInformacoesGerais(estabelecimentoCodigo: string): Promise<any | null> {
    try {
      const dados = await EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster(estabelecimentoCodigo);

      if (!dados) {
        log.info('Estabelecimento não encontrado', { estabelecimentoCodigo });
        throw new EstabelecimentoNotFoundError(estabelecimentoCodigo);
      }

      // Estrutura simplificada
      const response = {
        codigo: dados.codigo.trim(),  // Remove zeros à esquerda
        nome: dados.nome
      };

      return response;

    } catch (error) {
      if (error instanceof EstabelecimentoNotFoundError) {
        throw error;
      }

      log.error('Erro ao buscar informações gerais', {
        estabelecimentoCodigo,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      throw new DatabaseError(
        'Falha ao buscar informações do estabelecimento',
        error instanceof Error ? error : undefined
      );
    }
  }
}