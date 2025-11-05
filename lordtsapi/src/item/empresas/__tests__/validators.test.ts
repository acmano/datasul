// src/item/itemEmpresas/__tests__/validators.test.ts

import { itemEmpresasSchema } from '../validators';

describe('Validators - itemEmpresasSchema', () => {
  describe('Validações de sucesso', () => {
    it('deve validar código numérico', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: '7530110' });
      expect(error).toBeUndefined();
    });

    it('deve validar código alfanumérico', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: 'ABC123' });
      expect(error).toBeUndefined();
    });

    it('deve validar código com 1 caractere', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: 'A' });
      expect(error).toBeUndefined();
    });

    it('deve validar código com 16 caracteres (máximo)', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: '1234567890123456' });
      expect(error).toBeUndefined();
    });

    it('deve validar código misto', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: 'TEST123ABC456' });
      expect(error).toBeUndefined();
    });
  });

  describe('Validações de erro', () => {
    it('deve rejeitar quando código não for informado', () => {
      const { error } = itemEmpresasSchema.validate({});
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/obrigatório/i);
    });

    it('deve rejeitar código vazio', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: '' });
      expect(error).toBeDefined();
    });

    it('deve rejeitar código com mais de 16 caracteres', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: '12345678901234567' });
      expect(error).toBeDefined();
    });

    it('deve rejeitar código null', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: null });
      expect(error).toBeDefined();
    });

    it('deve rejeitar código undefined', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: undefined });
      expect(error).toBeDefined();
    });

    it('deve sanitizar caracteres perigosos (SQL injection)', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: "TEST'; DROP TABLE--" });
      expect(error).toBeDefined();
    });

    it('deve rejeitar código com espaços', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: 'TEST 123' });
      expect(error).toBeDefined();
    });

    it('deve rejeitar código com símbolos', () => {
      const { error } = itemEmpresasSchema.validate({ codigo: 'TEST@123' });
      expect(error).toBeDefined();
    });
  });

  describe('Validações adicionais', () => {
    it('deve rejeitar parâmetros extras', () => {
      const { error } = itemEmpresasSchema.validate({
        codigo: 'TEST123',
        extra: 'ignorar',
      });
      expect(error).toBeDefined();
      expect(error?.message).toContain('not allowed');
    });

    it('deve manter o tipo string do código', () => {
      const { error, value } = itemEmpresasSchema.validate({ codigo: '123' });
      expect(error).toBeUndefined();
      expect(typeof value.codigo).toBe('string');
      expect(value.codigo).toBe('123');
    });
  });
});
