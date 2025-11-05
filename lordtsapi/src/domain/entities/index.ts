// src/domain/entities/index.ts

/**
 * Barrel export - Entidades de Domínio
 *
 * Entidades são objetos com identidade única e ciclo de vida.
 * Contêm regras de negócio e invariantes do domínio.
 *
 * NOTA: Value Objects (*Codigo) são exportados de value-objects/index.ts
 */

export { Item } from './Item';
export { Familia } from './Familia';
export { FamiliaComercial } from './FamiliaComercial';
export { GrupoEstoque } from './GrupoEstoque';
export { Estabelecimento } from './Estabelecimento';
