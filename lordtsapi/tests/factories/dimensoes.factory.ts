// tests/factories/dimensoes.factory.ts

import { ItemDimensoesRaw, ItemDimensoesResponse } from '@/item/dadosCadastrais/dimensoes/types';

/**
 * Factory para criar dados de teste de Dimensões do Item
 */

// ========================================
// DIMENSÕES (Resultado da Query - Raw)
// ========================================
export function createDimensoesQueryResult(
  overrides?: Partial<ItemDimensoesRaw>
): ItemDimensoesRaw {
  return {
    itemCodigo: '7530110',
    itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
    pecaAltura: 10.5,
    pecaLargura: 8.3,
    pecaProfundidade: 6.2,
    pecaPeso: 0.250,
    itemEmbalagemAltura: 12.0,
    itemEmbalagemLargura: 10.0,
    itemEmbalagemProfundidade: 8.0,
    itemEmbalagemPeso: 0.300,
    itemEmbaladoAltura: 12.5,
    itemEmbaladoLargura: 10.5,
    itemEmbaladoProfundidade: 8.5,
    itemEmbaladoPeso: 0.350,
    pecasItem: 1,
    produtoEmbalagemAltura: 25.0,
    produtoEmbalagemLargura: 20.0,
    produtoEmbalagemProfundidade: 15.0,
    produtoEmbalagemPeso: 1.500,
    produtoGTIN13: '7891234567890',
    produtoEmbaladoAltura: 26.0,
    produtoEmbaladoLargura: 21.0,
    produtoEmbaladoProfundidade: 16.0,
    produtoEmbaladoPeso: 1.600,
    itensProduto: 4,
    embalagemSigla: 'CX',
    embalagemAltura: 25.5,
    embalagemLargura: 20.5,
    embalagemProfundidade: 15.5,
    embalagemPeso: 0.200,
    caixaGTIN14: '17891234567897',
    produtosCaixa: 12,
    paleteLastro: 8,
    paleteCamadas: 6,
    caixasPalete: 48,
    ...overrides,
  };
}

// ========================================
// DIMENSÕES (Response DTO Completo)
// ========================================
export function createDimensoesResponse(
  overrides?: Partial<ItemDimensoesResponse>
): ItemDimensoesResponse {
  const raw = createDimensoesQueryResult();
  
  return {
    itemCodigo: raw.itemCodigo,
    itemDescricao: raw.itemDescricao,
    peca: {
      altura: raw.pecaAltura,
      largura: raw.pecaLargura,
      profundidade: raw.pecaProfundidade,
      peso: raw.pecaPeso,
    },
    item: {
      pecas: raw.pecasItem,
      embalagem: {
        altura: raw.itemEmbalagemAltura,
        largura: raw.itemEmbalagemLargura,
        profundidade: raw.itemEmbalagemProfundidade,
        peso: raw.itemEmbalagemPeso,
      },
      embalado: {
        altura: raw.itemEmbaladoAltura,
        largura: raw.itemEmbaladoLargura,
        profundidade: raw.itemEmbaladoProfundidade,
        peso: raw.itemEmbaladoPeso,
      },
    },
    produto: {
      itens: raw.itensProduto,
      gtin13: raw.produtoGTIN13,
      embalagem: {
        altura: raw.produtoEmbalagemAltura,
        largura: raw.produtoEmbalagemLargura,
        profundidade: raw.produtoEmbalagemProfundidade,
        peso: raw.produtoEmbalagemPeso,
      },
      embalado: {
        altura: raw.produtoEmbaladoAltura,
        largura: raw.produtoEmbaladoLargura,
        profundidade: raw.produtoEmbaladoProfundidade,
        peso: raw.produtoEmbaladoPeso,
      },
    },
    caixa: {
      produtos: raw.produtosCaixa,
      gtin14: raw.caixaGTIN14,
      embalagem: {
        sigla: raw.embalagemSigla,
        altura: raw.embalagemAltura,
        largura: raw.embalagemLargura,
        profundidade: raw.embalagemProfundidade,
        peso: raw.embalagemPeso,
      },
    },
    palete: {
      lastro: raw.paleteLastro,
      camadas: raw.paleteCamadas,
      caixasPalete: raw.caixasPalete,
    },
    ...overrides,
  };
}

// ========================================
// CASOS ESPECIAIS
// ========================================

/**
 * Dimensões com todos os valores null (item sem cadastro completo)
 */
export function createDimensoesVazias(): ItemDimensoesRaw {
  return createDimensoesQueryResult({
    pecaAltura: null,
    pecaLargura: null,
    pecaProfundidade: null,
    pecaPeso: null,
    itemEmbalagemAltura: null,
    itemEmbalagemLargura: null,
    itemEmbalagemProfundidade: null,
    itemEmbalagemPeso: null,
    itemEmbaladoAltura: null,
    itemEmbaladoLargura: null,
    itemEmbaladoProfundidade: null,
    itemEmbaladoPeso: null,
    pecasItem: null,
    produtoEmbalagemAltura: null,
    produtoEmbalagemLargura: null,
    produtoEmbalagemProfundidade: null,
    produtoEmbalagemPeso: null,
    produtoGTIN13: null,
    produtoEmbaladoAltura: null,
    produtoEmbaladoLargura: null,
    produtoEmbaladoProfundidade: null,
    produtoEmbaladoPeso: null,
    itensProduto: null,
    embalagemSigla: null,
    embalagemAltura: null,
    embalagemLargura: null,
    embalagemProfundidade: null,
    embalagemPeso: null,
    caixaGTIN14: null,
    produtosCaixa: null,
    paleteLastro: null,
    paleteCamadas: null,
    caixasPalete: null,
  });
}

/**
 * Dimensões sem embalagem (produto sem caixa)
 */
export function createDimensoesSemEmbalagem(): ItemDimensoesRaw {
  return createDimensoesQueryResult({
    embalagemSigla: null,
    embalagemAltura: null,
    embalagemLargura: null,
    embalagemProfundidade: null,
    embalagemPeso: null,
  });
}

/**
 * Dimensões sem palete (item não paletizado)
 */
export function createDimensoesSemPalete(): ItemDimensoesRaw {
  return createDimensoesQueryResult({
    paleteLastro: null,
    paleteCamadas: null,
    caixasPalete: null,
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
  invalidFormat: 'Código contém caracteres inválidos',
  maxLength: 'Código não pode ter mais de 16 caracteres',
  sqlInjection: 'Código contém padrões não permitidos',
};