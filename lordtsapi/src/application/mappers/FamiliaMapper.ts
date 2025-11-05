// src/application/mappers/FamiliaMapper.ts

import { Familia } from '@domain/entities/Familia';
import type { FamiliaDTO, CreateFamiliaDTO } from '../dtos/FamiliaDTO';

/**
 * Mapper - Entidade Familia ↔ DTOs
 *
 * Responsável pela conversão entre entidades de domínio e DTOs.
 */
export class FamiliaMapper {
  /**
   * Converte Entidade → DTO
   *
   * @param familia - Entidade de domínio
   * @returns DTO para transferência
   */
  static toDTO(familia: Familia): FamiliaDTO {
    return {
      codigo: familia.codigoValue,
      descricao: familia.descricaoValue,
      ativo: familia.ativo
    };
  }

  /**
   * Converte DTO → Entidade
   *
   * @param dto - DTO de criação
   * @returns Entidade de domínio
   */
  static toDomain(dto: CreateFamiliaDTO): Familia {
    return Familia.create({
      codigo: dto.codigo,
      descricao: dto.descricao,
      ativo: dto.ativo ?? true
    });
  }

  /**
   * Converte array de Entidades → array de DTOs
   *
   * @param familias - Array de entidades
   * @returns Array de DTOs
   */
  static toDTOList(familias: Familia[]): FamiliaDTO[] {
    return familias.map(familia => this.toDTO(familia));
  }
}
