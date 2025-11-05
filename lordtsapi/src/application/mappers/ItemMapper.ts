// src/application/mappers/ItemMapper.ts

import { Item } from '@domain/entities/Item';
import type { ItemDTO, CreateItemDTO, ItemDetailDTO } from '../dtos/ItemDTO';

/**
 * Mapper - Entidade Item ↔ DTOs
 *
 * Responsável pela conversão entre entidades de domínio e DTOs.
 * Garante que a camada de aplicação não depende dos detalhes do domínio.
 */
export class ItemMapper {
  /**
   * Converte Entidade → DTO
   *
   * @param item - Entidade de domínio
   * @returns DTO para transferência
   */
  static toDTO(item: Item): ItemDTO {
    return {
      codigo: item.codigoValue,
      descricao: item.descricaoValue,
      unidade: item.unidadeValue,
      ativo: item.ativo,
      observacao: item.observacao
    };
  }

  /**
   * Converte DTO → Entidade
   *
   * @param dto - DTO de criação
   * @returns Entidade de domínio
   */
  static toDomain(dto: CreateItemDTO): Item {
    return Item.create({
      codigo: dto.codigo,
      descricao: dto.descricao,
      unidade: dto.unidade,
      ativo: dto.ativo ?? true,
      observacao: dto.observacao
    });
  }

  /**
   * Converte Entidade → DTO Detalhado
   *
   * @param item - Entidade de domínio
   * @param related - Dados relacionados (opcional)
   * @returns DTO detalhado
   */
  static toDetailDTO(
    item: Item,
    related?: {
      familia?: { codigo: string; descricao: string };
      familiaComercial?: { codigo: string; descricao: string };
      grupoEstoque?: { codigo: string; descricao: string };
      estabelecimentos?: Array<{ codigo: string; nome: string }>;
    }
  ): ItemDetailDTO {
    return {
      ...this.toDTO(item),
      familia: related?.familia,
      familiaComercial: related?.familiaComercial,
      grupoEstoque: related?.grupoEstoque,
      estabelecimentos: related?.estabelecimentos
    };
  }

  /**
   * Converte array de Entidades → array de DTOs
   *
   * @param items - Array de entidades
   * @returns Array de DTOs
   */
  static toDTOList(items: Item[]): ItemDTO[] {
    return items.map(item => this.toDTO(item));
  }
}
