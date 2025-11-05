// src/item/search/__tests__/validators.test.ts

import { itemSearchSchema } from '../validators';

describe('Validators - itemSearchSchema', () => {
  describe('Validações de sucesso', () => {
    it('deve validar busca por código', () => {
      const { error } = itemSearchSchema.validate({ codigo: 'TEST123' });
      expect(error).toBeUndefined();
    });

    it('deve validar busca por descrição', () => {
      const { error } = itemSearchSchema.validate({ descricao: 'Parafuso' });
      expect(error).toBeUndefined();
    });

    it('deve validar busca por descrição com wildcard *', () => {
      const { error } = itemSearchSchema.validate({ descricao: 'Para*' });
      expect(error).toBeUndefined();
    });

    it('deve validar busca por descrição com wildcard %', () => {
      const { error } = itemSearchSchema.validate({ descricao: 'Para%fuso' });
      expect(error).toBeUndefined();
    });

    it('deve validar busca por descrição com acentos', () => {
      const { error } = itemSearchSchema.validate({ descricao: 'Parafuso Métrico' });
      expect(error).toBeUndefined();
    });

    it('deve validar busca por descrição com caracteres especiais permitidos', () => {
      const { error } = itemSearchSchema.validate({ descricao: 'Parafuso (3/8") - M10' });
      expect(error).toBeUndefined();
    });

    it('deve validar busca por família', () => {
      const { error } = itemSearchSchema.validate({ familia: '450000' });
      expect(error).toBeUndefined();
    });

    it('deve validar busca por família comercial', () => {
      const { error } = itemSearchSchema.validate({ familiaComercial: 'FC001' });
      expect(error).toBeUndefined();
    });

    it('deve validar busca por grupo de estoque', () => {
      const { error } = itemSearchSchema.validate({ grupoEstoque: 'GE001' });
      expect(error).toBeUndefined();
    });

    it('deve validar GTIN com 13 dígitos', () => {
      const { error } = itemSearchSchema.validate({ gtin: '7896451824813' });
      expect(error).toBeUndefined();
    });

    it('deve validar GTIN com 14 dígitos', () => {
      const { error } = itemSearchSchema.validate({ gtin: '17896451824813' });
      expect(error).toBeUndefined();
    });

    it('deve validar múltiplos critérios', () => {
      const { error } = itemSearchSchema.validate({
        familia: '450000',
        grupoEstoque: 'GE001',
      });
      expect(error).toBeUndefined();
    });

    it('deve validar múltiplos critérios incluindo descricao', () => {
      const { error } = itemSearchSchema.validate({
        descricao: 'Parafuso*',
        familia: '450000',
      });
      expect(error).toBeUndefined();
    });

    it('deve validar busca por tipo do item com valor único', () => {
      const { error } = itemSearchSchema.validate({ tipoItem: ['0'] });
      expect(error).toBeUndefined();
    });

    it('deve validar busca por tipo do item com múltiplos valores', () => {
      const { error } = itemSearchSchema.validate({ tipoItem: ['0', '1', '4'] });
      expect(error).toBeUndefined();
    });

    it('deve validar busca por tipo do item com todos os valores válidos', () => {
      const { error } = itemSearchSchema.validate({
        tipoItem: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '99'],
      });
      expect(error).toBeUndefined();
    });

    it('deve validar busca combinando tipo do item com outros critérios', () => {
      const { error } = itemSearchSchema.validate({
        familia: '450000',
        tipoItem: ['0', '1'],
      });
      expect(error).toBeUndefined();
    });
  });

  describe('Validações de erro', () => {
    it('deve rejeitar descrição vazia', () => {
      const { error } = itemSearchSchema.validate({ descricao: '' });
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/não pode ser vazia|not allowed to be empty/i);
    });

    it('deve rejeitar descrição muito longa (>200 caracteres)', () => {
      const longDesc = 'A'.repeat(201);
      const { error } = itemSearchSchema.validate({ descricao: longDesc });
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/máximo 200 caracteres/i);
    });

    it('deve rejeitar descrição com caracteres SQL perigosos', () => {
      const { error } = itemSearchSchema.validate({ descricao: "'; DROP TABLE--" });
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/caracteres inválidos/i);
    });

    it('deve rejeitar descrição com tags HTML', () => {
      const { error } = itemSearchSchema.validate({ descricao: '<script>alert("xss")</script>' });
      expect(error).toBeDefined();
    });
    it('deve rejeitar objeto vazio', () => {
      const { error } = itemSearchSchema.validate({});
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/pelo menos um parâmetro/i);
    });

    it('deve rejeitar GTIN com menos de 13 dígitos', () => {
      const { error } = itemSearchSchema.validate({ gtin: '123456789012' });
      expect(error).toBeDefined();
    });

    it('deve rejeitar GTIN com mais de 14 dígitos', () => {
      const { error } = itemSearchSchema.validate({ gtin: '123456789012345' });
      expect(error).toBeDefined();
    });

    it('deve rejeitar GTIN não numérico', () => {
      const { error } = itemSearchSchema.validate({ gtin: 'ABC1234567890' });
      expect(error).toBeDefined();
    });

    it('deve sanitizar caracteres perigosos', () => {
      const { error, value } = itemSearchSchema.validate({ codigo: "TEST'; DROP TABLE--" });
      expect(error).toBeDefined();
    });

    it('deve rejeitar tipo do item com valor inválido', () => {
      const { error } = itemSearchSchema.validate({ tipoItem: ['11'] });
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/valores válidos/i);
    });

    it('deve rejeitar tipo do item com valor não numérico', () => {
      const { error } = itemSearchSchema.validate({ tipoItem: ['abc'] });
      expect(error).toBeDefined();
    });

    it('deve rejeitar tipo do item que não é array', () => {
      const { error } = itemSearchSchema.validate({ tipoItem: '0' });
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/array/i);
    });

    it('deve rejeitar tipo do item com valores parcialmente inválidos', () => {
      const { error } = itemSearchSchema.validate({ tipoItem: ['0', '15', '99'] });
      expect(error).toBeDefined();
    });
  });
});
