/**
 * Service - Suprimentos Fornecedores
 *
 * Camada de lógica de negócio para dados de fornecedores
 *
 * Em desenvolvimento
 */

import { FornecedorRepository } from './repository';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';
import type { FornecedorData, FornecedorCompleto, ItemFornecido } from './types';

/**
 * Service para processamento de dados de fornecedores
 *
 * Responsável por:
 * - Orquestrar chamadas ao repository
 * - Aplicar regras de negócio
 * - Validar e enriquecer dados
 * - Transformar dados para o formato de resposta
 *
 * TODO: Implementar lógica de negócio específica
 */
export class FornecedorService {
  /**
   * Busca dados completos de um fornecedor
   *
   * @param codigo - Código do fornecedor
   * @returns Dados do fornecedor processados
   */
  static async getFornecedor(codigo: string): Promise<FornecedorCompleto | null> {
    return withErrorHandling(
      async () => {
        log.debug('FornecedorService.getFornecedor - Em desenvolvimento', { codigo });

        const fornecedor = await FornecedorRepository.getFornecedor(codigo);

        validateEntityExists(fornecedor, ItemNotFoundError, 'codigo', codigo, 'Fornecedor', 'M');

        // TODO: Aplicar transformações e regras de negócio
        // - Formatar CNPJ
        // - Validar status
        // - Enriquecer com informações adicionais

        return fornecedor;
      },
      {
        entityName: 'fornecedor',
        codeFieldName: 'codigo',
        codeValue: codigo,
        operationName: 'buscar fornecedor',
      },
      ItemNotFoundError
    );
  }

  /**
   * Lista todos os fornecedores
   *
   * TODO: Implementar com filtros e paginação
   */
  static async listFornecedores(): Promise<FornecedorData[]> {
    return withErrorHandling(
      async () => {
        log.debug('FornecedorService.listFornecedores - Em desenvolvimento');

        const fornecedores = await FornecedorRepository.listFornecedores();

        // TODO: Aplicar filtros e ordenação
        return fornecedores;
      },
      {
        entityName: 'fornecedor',
        codeFieldName: 'list',
        codeValue: 'all',
        operationName: 'listar fornecedores',
      }
    );
  }

  /**
   * Busca itens fornecidos por um fornecedor
   */
  static async getItensFornecidos(codigo: string): Promise<ItemFornecido[]> {
    return withErrorHandling(
      async () => {
        log.debug('FornecedorService.getItensFornecidos - Em desenvolvimento', { codigo });

        const itens = await FornecedorRepository.getItensFornecidos(codigo);

        // TODO: Enriquecer com informações de estoque/preço
        return itens;
      },
      {
        entityName: 'fornecedor_itens',
        codeFieldName: 'codigo',
        codeValue: codigo,
        operationName: 'buscar itens fornecidos',
      }
    );
  }
}
