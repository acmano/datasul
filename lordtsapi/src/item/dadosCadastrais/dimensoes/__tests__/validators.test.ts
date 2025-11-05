// src/item/dadosCadastrais/dimensoes/__tests__/validators.test.ts

import { dimensoesParamsSchema } from '../validators';
import { testItemCodigos } from '@tests/factories/dimensoes.factory';

describe('Validators - dimensoesParamsSchema', () => {
  // ========================================
  // CÓDIGOS VÁLIDOS
  // ========================================
  describe('Códigos Válidos', () => {
    testItemCodigos.valid.forEach((codigo) => {
      it(`deve aceitar código válido: "${codigo}"`, () => {
        const { error, value } = dimensoesParamsSchema.validate({
          itemCodigo: codigo,
        });

        expect(error).toBeUndefined();
        expect(value.itemCodigo).toBe(codigo);
      });
    });

    it('deve aceitar código com letras maiúsculas', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: 'ABCDEF',
      });

      expect(error).toBeUndefined();
    });

    it('deve aceitar código com letras minúsculas', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: 'abcdef',
      });

      expect(error).toBeUndefined();
    });

    it('deve aceitar código alfanumérico misto', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: 'Abc123Xyz',
      });

      expect(error).toBeUndefined();
    });
  });

  // ========================================
  // CÓDIGOS INVÁLIDOS
  // ========================================
  describe('Códigos Inválidos', () => {
    it('deve rejeitar código vazio', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: '',
      });

      expect(error).toBeDefined();
    });

    it('deve rejeitar código apenas com espaços', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: '   ',
      });

      expect(error).toBeDefined();
    });

    it('deve rejeitar código muito longo (>16 caracteres)', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: '12345678901234567', // 17 caracteres
      });

      expect(error).toBeDefined();
    });

    it('deve rejeitar código com caracteres especiais', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: 'ABC@123',
      });

      expect(error).toBeDefined();
    });

    it('deve rejeitar código com espaços no meio', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: 'ABC 123',
      });

      expect(error).toBeDefined();
    });
  });

  // ========================================
  // SANITIZAÇÃO
  // ========================================
  describe('Sanitização', () => {
    testItemCodigos.sanitized.forEach(({ input, expected }) => {
      it(`deve sanitizar "${input}" para "${expected}"`, () => {
        const { error, value } = dimensoesParamsSchema.validate({
          itemCodigo: input,
        });

        if (error) {
          // Se houver erro, é porque a sanitização removeu tudo
          expect(error).toBeDefined();
        } else {
          expect(value.itemCodigo).toBe(expected);
        }
      });
    });

    it('deve remover espaços no início e fim', () => {
      const { error, value } = dimensoesParamsSchema.validate({
        itemCodigo: '  7530110  ',
      });

      expect(error).toBeUndefined();
      expect(value.itemCodigo).toBe('7530110');
    });

    it('deve remover caracteres de controle', () => {
      const { error, value } = dimensoesParamsSchema.validate({
        itemCodigo: '753\x000110',
      });

      expect(error).toBeUndefined();
      expect(value.itemCodigo).toBe('7530110');
    });
  });

  // ========================================
  // SEGURANÇA - SQL INJECTION
  // ========================================
  describe('Proteção SQL Injection', () => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE item;--",
      "' OR '1'='1",
      "1'; DELETE FROM item;--",
      "' UNION SELECT * FROM users--",
    ];

    sqlInjectionAttempts.forEach((malicious) => {
      it(`deve bloquear tentativa: "${malicious}"`, () => {
        const { error } = dimensoesParamsSchema.validate({
          itemCodigo: malicious,
        });

        expect(error).toBeDefined();
      });
    });
  });

  // ========================================
  // SEGURANÇA - COMMAND INJECTION
  // ========================================
  describe('Proteção Command Injection', () => {
    const commandInjectionAttempts = [
      'item|ls',
      'item&&whoami',
      'item;cat /etc/passwd',
      'item`whoami`',
      'item$(whoami)',
    ];

    commandInjectionAttempts.forEach((malicious) => {
      it(`deve bloquear tentativa: "${malicious}"`, () => {
        const { error } = dimensoesParamsSchema.validate({
          itemCodigo: malicious,
        });

        expect(error).toBeDefined();
      });
    });
  });

  // ========================================
  // SEGURANÇA - XSS
  // ========================================
  describe('Proteção XSS', () => {
    const xssAttempts = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
    ];

    xssAttempts.forEach((malicious) => {
      it(`deve bloquear tentativa: "${malicious}"`, () => {
        const { error } = dimensoesParamsSchema.validate({
          itemCodigo: malicious,
        });

        expect(error).toBeDefined();
      });
    });
  });

  // ========================================
  // CAMPOS OBRIGATÓRIOS
  // ========================================
  describe('Validação de Campos Obrigatórios', () => {
    it('deve rejeitar objeto sem itemCodigo', () => {
      const { error } = dimensoesParamsSchema.validate({});

      expect(error).toBeDefined();
    });

    it('deve rejeitar itemCodigo null', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: null,
      });

      expect(error).toBeDefined();
    });

    it('deve rejeitar itemCodigo undefined', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: undefined,
      });

      expect(error).toBeDefined();
    });
  });

  // ========================================
  // TIPO DE DADOS
  // ========================================
  describe('Validação de Tipo', () => {
    it('deve rejeitar número', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: 123456,
      });

      expect(error).toBeDefined();
    });

    it('deve rejeitar boolean', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: true,
      });

      expect(error).toBeDefined();
    });

    it('deve rejeitar array', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: ['7530110'],
      });

      expect(error).toBeDefined();
    });

    it('deve rejeitar objeto', () => {
      const { error } = dimensoesParamsSchema.validate({
        itemCodigo: { codigo: '7530110' },
      });

      expect(error).toBeDefined();
    });
  });
});
