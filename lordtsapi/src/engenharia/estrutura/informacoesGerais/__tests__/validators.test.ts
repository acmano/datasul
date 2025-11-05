import { validateItemCodigo, validateDataReferencia, validateConsultaParams } from '../validators';
import { ValidationError } from '@shared/errors/errors';

describe('Estrutura - Validators', () => {
  describe('validateItemCodigo', () => {
    it('deve aceitar código válido', () => {
      expect(() => validateItemCodigo('7530110')).not.toThrow();
      expect(() => validateItemCodigo('ABC123')).not.toThrow();
    });

    it('deve rejeitar código vazio', () => {
      expect(() => validateItemCodigo('')).toThrow(ValidationError);
      expect(() => validateItemCodigo('   ')).toThrow(ValidationError);
    });

    it('deve rejeitar código null/undefined', () => {
      expect(() => validateItemCodigo(null as unknown as string)).toThrow(ValidationError);
      expect(() => validateItemCodigo(undefined as unknown as string)).toThrow(ValidationError);
    });

    it('deve rejeitar tipo não-string', () => {
      expect(() => validateItemCodigo(123 as unknown as string)).toThrow(ValidationError);
      expect(() => validateItemCodigo({} as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('validateDataReferencia', () => {
    it('deve aceitar data válida no formato YYYY-MM-DD', () => {
      expect(() => validateDataReferencia('2025-01-15')).not.toThrow();
      expect(() => validateDataReferencia('2024-12-31')).not.toThrow();
    });

    it('deve aceitar undefined (data é opcional)', () => {
      expect(() => validateDataReferencia(undefined)).not.toThrow();
    });

    it('deve rejeitar formato inválido', () => {
      expect(() => validateDataReferencia('15/01/2025')).toThrow(ValidationError);
      expect(() => validateDataReferencia('2025-1-15')).toThrow(ValidationError);
      expect(() => validateDataReferencia('15-01-2025')).toThrow(ValidationError);
    });

    it('deve rejeitar data inválida', () => {
      expect(() => validateDataReferencia('2025-13-01')).toThrow(ValidationError);
      expect(() => validateDataReferencia('2025-02-30')).toThrow(ValidationError);
    });

    it('deve rejeitar data muito antiga', () => {
      expect(() => validateDataReferencia('1899-12-31')).toThrow(ValidationError);
    });

    it('deve rejeitar data muito futura', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 20);
      const dateStr = futureDate.toISOString().split('T')[0];
      expect(() => validateDataReferencia(dateStr)).toThrow(ValidationError);
    });

    it('deve rejeitar tipo não-string', () => {
      expect(() => validateDataReferencia(123 as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('validateConsultaParams', () => {
    it('deve validar parâmetros completos', () => {
      expect(() => validateConsultaParams('7530110', '2025-01-15')).not.toThrow();
    });

    it('deve validar apenas itemCodigo', () => {
      expect(() => validateConsultaParams('7530110')).not.toThrow();
    });

    it('deve rejeitar itemCodigo inválido', () => {
      expect(() => validateConsultaParams('', '2025-01-15')).toThrow(ValidationError);
    });

    it('deve rejeitar data inválida', () => {
      expect(() => validateConsultaParams('7530110', 'invalid')).toThrow(ValidationError);
    });
  });
});
