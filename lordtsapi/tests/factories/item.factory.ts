// tests/factories/item.factory.ts

import {
  ItemMasterQueryResult,
  ItemEstabelecimentoQueryResult,
  ItemData,
  FamiliaData,
  FamiliaComercialData,
  GrupoDeEstoqueData,
  EstabelecimentoData,
} from '@/item/dadosCadastrais/informacoesGerais/types';

/**
 * Factory para criar dados de teste do Item
 *
 * IMPORTANTE: Todos os helpers incluem os novos campos adicionados:
 * - status (obrigatório)
 * - estabelecimentoPadraoCodigo (obrigatório)
 * - dataImplantacao (obrigatório)
 * - dataLiberacao (obrigatório)
 * - dataObsolescencia (opcional)
 * - endereco (opcional)
 * - descricaoResumida (opcional)
 * - descricaoAlternativa (opcional)
 * - contenedor { codigo, descricao } (opcional)
 */

// ========================================
// ITEM MASTER (Resultado da Query) - COM NOVOS CAMPOS
// ========================================
export function createItemMasterQueryResult(
  overrides?: Partial<ItemMasterQueryResult & {
    status?: string;
    estabelecimentoPadraoCodigo?: string;
    dataImplantacao?: string;
    dataLiberacao?: string;
    dataObsolescencia?: string | null;
    endereco?: string | null;
    descricaoResumida?: string | null;
    descricaoAlternativa?: string | null;
    contenedorCodigo?: string | null;
    contenedorDescricao?: string | null;
  }>
): any {
  return {
    itemCodigo: '7530110',
    itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
    itemUnidade: 'UN',
    familiaCodigo: '450000',
    familiaComercialCodigo: 'VLV',
    grupoDeEstoqueCodigo: '10',
    // NOVOS CAMPOS OBRIGATÓRIOS
    status: 'Ativo',
    estabelecimentoPadraoCodigo: '01.01',
    dataImplantacao: '01/01/2020',
    dataLiberacao: '15/01/2020',
    // NOVOS CAMPOS OPCIONAIS
    dataObsolescencia: null,
    endereco: 'A-01-02-03',
    descricaoResumida: 'VALVULA 1/2"',
    descricaoAlternativa: 'BALL VALVE 1/2"',
    contenedorCodigo: 'CX01',
    contenedorDescricao: 'CAIXA PEQUENA',
    ...overrides,
  };
}

// ========================================
// ESTABELECIMENTO (Resultado da Query)
// ========================================
export function createItemEstabQueryResult(
  overrides?: Partial<ItemEstabelecimentoQueryResult & {
    estabelecimentoNome?: string;
    status?: number;
  }>
): any {
  return {
    itemCodigo: '7530110',
    estabelecimentoCodigo: '01.01',
    estabelecimentoNome: 'CD São Paulo',
    status: 0, // 0 = ativo
    ...overrides,
  };
}

// ========================================
// ITEM DATA (Response DTO) - ATUALIZADO COM TODOS OS CAMPOS
// ========================================
export function createItemData(
  overrides?: Partial<ItemData>
): ItemData {
  return {
    codigo: '7530110',
    descricao: 'VALVULA DE ESFERA 1/2" BRONZE',
    unidade: 'UN',
    // NOVOS CAMPOS OBRIGATÓRIOS
    status: 'Ativo',
    estabelecimentoPadraoCodigo: '01.01',
    dataImplantacao: '01/01/2020',
    dataLiberacao: '15/01/2020',
    // NOVOS CAMPOS OPCIONAIS
    dataObsolescencia: undefined, // opcional
    endereco: 'A-01-02-03',
    descricaoResumida: 'VALVULA 1/2"',
    descricaoAlternativa: 'BALL VALVE 1/2"',
    contenedor: {
      codigo: 'CX01',
      descricao: 'CAIXA PEQUENA',
    },
    ...overrides,
  };
}

// ========================================
// FAMILIA DATA
// ========================================
export function createFamiliaData(
  overrides?: Partial<FamiliaData>
): FamiliaData {
  return {
    codigo: '450000',
    descricao: 'VALVULAS',
    ...overrides,
  };
}

// ========================================
// FAMILIA COMERCIAL DATA
// ========================================
export function createFamiliaComercialData(
  overrides?: Partial<FamiliaComercialData>
): FamiliaComercialData {
  return {
    codigo: 'VLV',
    descricao: 'VALVULAS INDUSTRIAIS',
    ...overrides,
  };
}

// ========================================
// GRUPO DE ESTOQUE DATA
// ========================================
export function createGrupoDeEstoqueData(
  overrides?: Partial<GrupoDeEstoqueData>
): GrupoDeEstoqueData {
  return {
    codigo: '10',
    descricao: 'PECAS E COMPONENTES',
    ...overrides,
  };
}

// ========================================
// ESTABELECIMENTO DATA
// ========================================
export function createEstabelecimentoData(
  overrides?: Partial<EstabelecimentoData>
): EstabelecimentoData {
  return {
    codigo: '01.01',
    nome: 'CD São Paulo',
    ...overrides,
  };
}

// ========================================
// INFORMAÇÕES GERAIS COMPLETAS (Response DTO Final)
// ========================================
export function createInformacoesGerais(
  overrides?: Partial<{
    item: ItemData;
    familia: FamiliaData | null;
    familiaComercial: FamiliaComercialData | null;
    grupoDeEstoque: GrupoDeEstoqueData | null;
    estabelecimentos: EstabelecimentoData[];
  }>
): any {
  return {
    item: createItemData(),
    familia: createFamiliaData(),
    familiaComercial: createFamiliaComercialData(),
    grupoDeEstoque: createGrupoDeEstoqueData(),
    estabelecimentos: [
      createEstabelecimentoData(),
      createEstabelecimentoData({ codigo: '02.01', nome: 'Fábrica Joinville' }),
    ],
    ...overrides,
  };
}

// ========================================
// CASOS ESPECIAIS - Novos Campos
// ========================================

/**
 * Item com todos os campos opcionais preenchidos
 */
export function createItemComTodosOsCampos(): any {
  return createItemMasterQueryResult({
    status: 'Ativo',
    estabelecimentoPadraoCodigo: '01.01',
    dataImplantacao: '01/01/2020',
    dataLiberacao: '15/01/2020',
    dataObsolescencia: '31/12/2025',
    endereco: 'A-01-02-03',
    descricaoResumida: 'VALVULA 1/2"',
    descricaoAlternativa: 'BALL VALVE 1/2"',
    contenedorCodigo: 'CX01',
    contenedorDescricao: 'CAIXA PEQUENA',
  });
}

/**
 * Item com campos opcionais vazios (somente obrigatórios)
 */
export function createItemSemCamposOpcionais(): any {
  return createItemMasterQueryResult({
    status: 'Ativo',
    estabelecimentoPadraoCodigo: '01.01',
    dataImplantacao: '01/01/2020',
    dataLiberacao: '15/01/2020',
    dataObsolescencia: null,
    endereco: null,
    descricaoResumida: null,
    descricaoAlternativa: null,
    contenedorCodigo: null,
    contenedorDescricao: null,
  });
}

/**
 * Item com diferentes status
 */
export function createItemComStatus(
  status: 'Ativo' | 'Obsoleto Ordens Automáticas' | 'Obsoleto Todas as Ordens' | 'Totalmente Obsoleto'
): any {
  return createItemMasterQueryResult({ status });
}

/**
 * Item obsoleto
 */
export function createItemObsoleto(): any {
  return createItemMasterQueryResult({
    status: 'Totalmente Obsoleto',
    dataObsolescencia: '31/12/2024',
  });
}

/**
 * Item ativo sem data de obsolescência
 */
export function createItemAtivo(): any {
  return createItemMasterQueryResult({
    status: 'Ativo',
    dataObsolescencia: null,
  });
}

/**
 * Item inativo
 */
export function createItemInativo(): any {
  return createItemMasterQueryResult({
    status: 'Obsoleto Todas as Ordens',
    dataObsolescencia: '31/12/2024',
  });
}

/**
 * Item com contenedor completo
 */
export function createItemComContenedor(): any {
  return createItemMasterQueryResult({
    contenedorCodigo: 'CX01',
    contenedorDescricao: 'CAIXA PEQUENA',
  });
}

/**
 * Item sem contenedor
 */
export function createItemSemContenedor(): any {
  return createItemMasterQueryResult({
    contenedorCodigo: null,
    contenedorDescricao: null,
  });
}

/**
 * Item com endereço de estoque
 */
export function createItemComEndereco(): any {
  return createItemMasterQueryResult({
    endereco: 'A-01-02-03',
  });
}

/**
 * Item sem endereço de estoque
 */
export function createItemSemEndereco(): any {
  return createItemMasterQueryResult({
    endereco: null,
  });
}

/**
 * Item com descrições alternativas
 */
export function createItemComDescricoesAlternativas(): any {
  return createItemMasterQueryResult({
    descricaoResumida: 'VALVULA 1/2"',
    descricaoAlternativa: 'BALL VALVE 1/2"',
  });
}

/**
 * Item sem descrições alternativas
 */
export function createItemSemDescricoesAlternativas(): any {
  return createItemMasterQueryResult({
    descricaoResumida: null,
    descricaoAlternativa: null,
  });
}

// ========================================
// ARRAYS DE TESTE (múltiplos itens)
// ========================================
export function createMultipleEstabelecimentos(
  count: number,
  baseOverrides?: Partial<any>
): any[] {
  return Array.from({ length: count }, (_, i) =>
    createItemEstabQueryResult({
      estabelecimentoCodigo: `0${i + 1}.01`,
      estabelecimentoNome: `Estabelecimento ${i + 1}`,
      status: i % 2 === 0 ? 0 : 1, // Alterna entre ativo/inativo
      ...baseOverrides,
    })
  );
}

// ========================================
// CASOS ESPECIAIS - Validação
// ========================================

/**
 * Item sem estabelecimentos
 */
export function createItemSemEstabelecimentos(): any[] {
  return [];
}

/**
 * Códigos de item para testes de validação
 */
export const testItemCodigos = {
  valid: [
    '7530110',
    'ABC123',
    'ITEM001',
    '1',
    'A',
    '1234567890123456', // 16 caracteres (máximo)
  ],

  invalid: [
    '', // Vazio
    '   ', // Só espaços
    '12345678901234567', // 17 caracteres (excede máximo)
    'SELECT * FROM item', // SQL Injection
    '../../../etc/passwd', // Path Traversal
    '<script>alert(1)</script>', // XSS
    'item; DROP TABLE item;--', // SQL Injection com ;
    'item\'--', // SQL Injection com '
    'item|ls', // Command Injection
    'item&&whoami', // Command Injection
    'item$USER', // Variable Injection
  ],

  sanitized: [
    { input: '  7530110  ', expected: '7530110' }, // Remove espaços
    { input: 'ABC-123', expected: 'ABC123' }, // Remove hífen
    { input: 'item"test', expected: 'itemtest' }, // Remove aspas
    { input: 'item;test', expected: 'itemtest' }, // Remove ponto e vírgula
  ],
};

/**
 * Mensagens de erro esperadas
 */
export const expectedErrors = {
  itemNotFound: (codigo: string) => `Item ${codigo} não encontrado`,
  validationError: 'Código do item é obrigatório',
  invalidFormat: 'Código do item contém caracteres inválidos. Use apenas letras, números e caracteres básicos',
  maxLength: 'Código do item não pode ter mais de 16 caracteres',
  sqlInjection: 'Código do item contém padrões não permitidos',
  commandInjection: 'Código do item contém caracteres não permitidos',
};

/**
 * Valores de status válidos
 */
export const statusValidos = [
  'Ativo',
  'Obsoleto Ordens Automáticas',
  'Obsoleto Todas as Ordens',
  'Totalmente Obsoleto',
] as const;

/**
 * Formatos de data esperados
 */
export const formatosData = {
  regex: /^\d{2}\/\d{2}\/\d{4}$/,
  exemplo: 'dd/mm/yyyy',
  validos: [
    '01/01/2020',
    '15/01/2020',
    '31/12/2025',
  ],
  invalidos: [
    '2020-01-01', // ISO format
    '01-01-2020', // Separador errado
    '1/1/2020', // Sem zeros à esquerda
  ],
};