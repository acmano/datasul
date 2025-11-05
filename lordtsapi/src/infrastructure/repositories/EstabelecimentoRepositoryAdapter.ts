// @ts-nocheck
// src/infrastructure/repositories/EstabelecimentoRepositoryAdapter.ts

import type {
  IEstabelecimentoRepository,
  EstabelecimentoCompleto,
  PaginationOptions,
  PaginatedResult,
} from '@application/interfaces/repositories';
import { Estabelecimento } from '@domain/entities';

// Legacy repository
import { EstabelecimentoInformacoesGeraisRepository } from '@/estabelecimento/dadosCadastrais/informacoesGerais/repository';

/**
 * Adapter do Repositório de Estabelecimento
 */
export class EstabelecimentoRepositoryAdapter implements IEstabelecimentoRepository {
  async findByCodigo(codigo: string): Promise<Estabelecimento | null> {
    try {
      const result =
        await EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster(codigo);

      if (!result) {
        return null;
      }

      return Estabelecimento.create({
        codigo: result.estabelecimentoCodigo,
        nome: result.estabelecimentoNome,
      });
    } catch (error) {
      console.error('Error finding estabelecimento:', error);
      return null;
    }
  }

  async findCompleto(codigo: string): Promise<EstabelecimentoCompleto | null> {
    const estabelecimento = await this.findByCodigo(codigo);
    if (!estabelecimento) return null;

    return {
      estabelecimento,
    };
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<Estabelecimento>> {
    // TODO: Implementar quando houver método no repositório legado
    return {
      data: [],
      pagination: {
        page: options?.page ?? 1,
        limit: options?.limit ?? 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  async findByItem(itemCodigo: string): Promise<Estabelecimento[]> {
    // TODO: Implementar
    return [];
  }

  async exists(codigo: string): Promise<boolean> {
    const estab = await this.findByCodigo(codigo);
    return estab !== null;
  }
}
