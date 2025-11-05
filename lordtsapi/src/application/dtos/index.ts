// src/application/dtos/index.ts

/**
 * Barrel export - Data Transfer Objects
 *
 * DTOs são objetos simples para transferência de dados
 * entre camadas, sem lógica de negócio.
 */

// Item DTOs
export type {
  ItemDTO,
  CreateItemDTO,
  UpdateItemDTO,
  ItemDetailDTO,
  ItemListDTO,
  SearchItemsDTO,
  SearchItemsResultDTO
} from './ItemDTO';

// Familia DTOs
export type {
  FamiliaDTO,
  CreateFamiliaDTO,
  UpdateFamiliaDTO,
  FamiliaListDTO,
  ListFamiliasDTO,
  ListFamiliasResultDTO
} from './FamiliaDTO';
