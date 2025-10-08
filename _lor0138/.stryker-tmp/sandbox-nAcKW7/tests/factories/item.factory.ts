// @ts-nocheck
// tests/factories/item.factory.ts

import {
  ItemMasterQueryResult,
  ItemEstabQueryResult,
  ItemInformacoesGerais,
  ItemInformacoesGeraisEstabelecimento,
} from '@api/lor0138/item/dadosCadastrais/informacoesGerais/types/informacoesGerais.types';

/**
 * Factory para criar dados de teste do Item
 */

// ========================================
// ITEM MASTER (Resultado da Query)
// ========================================
export function createItemMasterQueryResult(
  overrides?: Partial<ItemMasterQueryResult>
): ItemMasterQueryResult {
  return {
    itemCodigo: '7530110',
    itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
    itemUnidade: 'UN',
    ...overrides,
  };
}

// ========================================
// ESTABELECIMENTO (Resultado da Query)
// ========================================
export function createItemEstabQueryResult(
  overrides?: Partial<ItemEstabQueryResult>
): ItemEstabQueryResult {
  return {
    itemCodigo: '7530110',
    estabCodigo: '01.01',
    estabNome: 'CD São Paulo',
    codObsoleto: 0,
    ...overrides,
  };
}

// ========================================
// ESTABELECIMENTO (Response DTO)
// ========================================
export function createItemEstabelecimento(
  overrides?: Partial<ItemInformacoesGeraisEstabelecimento>
): ItemInformacoesGeraisEstabelecimento {
  return {
    itemCodigo: '7530110',
    estabCodigo: '01.01',
    estabNome: 'CD São Paulo',
    statusIndex: 1, // 0 = ativo (1), outros = inativo (2)
    ...overrides,
  };
}

// ========================================
// INFORMAÇÕES GERAIS (Response DTO Completo)
// ========================================
export function createInformacoesGerais(
  overrides?: Partial<ItemInformacoesGerais>
): ItemInformacoesGerais {
  return {
    identificacaoItemCodigo: '7530110',
    identificacaoItemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
    identificacaoItemUnidade: 'UN',
    identificacaoItensEstabelecimentos: [
      createItemEstabelecimento(),
      createItemEstabelecimento({
        estabCodigo: '02.01',
        estabNome: 'Fábrica Joinville',
        statusIndex: 2,
      }),
    ],
    ...overrides,
  };
}

// ========================================
// ARRAYS DE TESTE (múltiplos itens)
// ========================================
export function createMultipleEstabelecimentos(
  count: number,
  baseOverrides?: Partial<ItemInformacoesGeraisEstabelecimento>
): ItemInformacoesGeraisEstabelecimento[] {
  return Array.from({ length: count }, (_, i) =>
    createItemEstabelecimento({
      estabCodigo: `0${i + 1}.01`,
      estabNome: `Estabelecimento ${i + 1}`,
      statusIndex: i % 2 === 0 ? 1 : 2, // Alterna entre ativo/inativo
      ...baseOverrides,
    })
  );
}

// ========================================
// CASOS ESPECIAIS
// ========================================

/**
 * Item sem estabelecimentos
 */
export function createItemSemEstabelecimentos(): ItemInformacoesGerais {
  return createInformacoesGerais({
    identificacaoItensEstabelecimentos: [],
  });
}

/**
 * Item com estabelecimento obsoleto
 */
export function createItemComEstabObsoleto(): ItemInformacoesGerais {
  return createInformacoesGerais({
    identificacaoItensEstabelecimentos: [
      createItemEstabelecimento({
        statusIndex: 2, // Obsoleto
      }),
    ],
  });
}

/**
 * Item com múltiplos estabelecimentos (10)
 */
export function createItemComMuitosEstabs(): ItemInformacoesGerais {
  return createInformacoesGerais({
    identificacaoItensEstabelecimentos: createMultipleEstabelecimentos(10),
  });
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