// src/core/validators/__tests__/ValidationChain.test.ts

import {
  ValidationChain,
  RequiredValidator,
  LengthValidator,
  PatternValidator,
  NumericValidator,
  CustomValidator,
  ValidationException,
} from '../ValidationChain';

describe('ValidationChain', () => {
  describe('RequiredValidator', () => {
    it('deve passar quando campo está preenchido', () => {
      // Arrange
      const validator = new RequiredValidator('name');
      const data = { name: 'John Doe' };

      // Act
      const result = validator.validate(data);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve falhar quando campo é undefined', () => {
      // Arrange
      const validator = new RequiredValidator('name');
      const data = {};

      // Act
      const result = validator.validate(data);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('name');
      expect(result.errors[0]?.code).toBe('REQUIRED');
    });

    it('deve falhar quando campo é null', () => {
      // Arrange
      const validator = new RequiredValidator('name');
      const data = { name: null };

      // Act
      const result = validator.validate(data);

      // Assert
      expect(result.valid).toBe(false);
    });

    it('deve falhar quando campo é string vazia', () => {
      // Arrange
      const validator = new RequiredValidator('name');
      const data = { name: '' };

      // Act
      const result = validator.validate(data);

      // Assert
      expect(result.valid).toBe(false);
    });

    it('deve usar mensagem customizada', () => {
      // Arrange
      const validator = new RequiredValidator('name', 'Nome é obrigatório');
      const data = {};

      // Act
      const result = validator.validate(data);

      // Assert
      expect(result.errors[0]?.message).toBe('Nome é obrigatório');
    });
  });

  describe('LengthValidator', () => {
    it('deve validar comprimento mínimo', () => {
      // Arrange
      const validator = new LengthValidator('password', { min: 6 });

      // Act
      const resultInvalid = validator.validate({ password: '12345' });
      const resultValid = validator.validate({ password: '123456' });

      // Assert
      expect(resultInvalid.valid).toBe(false);
      expect(resultInvalid.errors[0]?.code).toBe('MIN_LENGTH');
      expect(resultValid.valid).toBe(true);
    });

    it('deve validar comprimento máximo', () => {
      // Arrange
      const validator = new LengthValidator('username', { max: 10 });

      // Act
      const resultInvalid = validator.validate({ username: '12345678901' });
      const resultValid = validator.validate({ username: '1234567890' });

      // Assert
      expect(resultInvalid.valid).toBe(false);
      expect(resultInvalid.errors[0]?.code).toBe('MAX_LENGTH');
      expect(resultValid.valid).toBe(true);
    });

    it('deve validar min e max juntos', () => {
      // Arrange
      const validator = new LengthValidator('code', { min: 3, max: 8 });

      // Act
      const resultTooShort = validator.validate({ code: '12' });
      const resultTooLong = validator.validate({ code: '123456789' });
      const resultValid = validator.validate({ code: '12345' });

      // Assert
      expect(resultTooShort.valid).toBe(false);
      expect(resultTooLong.valid).toBe(false);
      expect(resultValid.valid).toBe(true);
    });

    it('deve pular validação se não for string', () => {
      // Arrange
      const validator = new LengthValidator('age', { min: 1, max: 3 });

      // Act
      const result = validator.validate({ age: 25 });

      // Assert
      expect(result.valid).toBe(true);
    });
  });

  describe('PatternValidator', () => {
    it('deve validar pattern de email', () => {
      // Arrange
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validator = new PatternValidator('email', emailPattern);

      // Act
      const resultInvalid = validator.validate({ email: 'invalid-email' });
      const resultValid = validator.validate({ email: 'test@example.com' });

      // Assert
      expect(resultInvalid.valid).toBe(false);
      expect(resultInvalid.errors[0]?.code).toBe('PATTERN_MISMATCH');
      expect(resultValid.valid).toBe(true);
    });

    it('deve validar pattern de código numérico', () => {
      // Arrange
      const numericPattern = /^\d+$/;
      const validator = new PatternValidator('codigo', numericPattern);

      // Act
      const resultInvalid = validator.validate({ codigo: 'ABC123' });
      const resultValid = validator.validate({ codigo: '123456' });

      // Assert
      expect(resultInvalid.valid).toBe(false);
      expect(resultValid.valid).toBe(true);
    });

    it('deve usar mensagem customizada', () => {
      // Arrange
      const validator = new PatternValidator(
        'cpf',
        /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
        'CPF deve estar no formato XXX.XXX.XXX-XX'
      );

      // Act
      const result = validator.validate({ cpf: '12345678900' });

      // Assert
      expect(result.errors[0]?.message).toBe(
        'CPF deve estar no formato XXX.XXX.XXX-XX'
      );
    });
  });

  describe('NumericValidator', () => {
    it('deve validar se é número', () => {
      // Arrange
      const validator = new NumericValidator('age');

      // Act
      const resultInvalid = validator.validate({ age: 'vinte' });
      const resultValid = validator.validate({ age: 20 });

      // Assert
      expect(resultInvalid.valid).toBe(false);
      expect(resultInvalid.errors[0]?.code).toBe('NOT_NUMBER');
      expect(resultValid.valid).toBe(true);
    });

    it('deve validar valor mínimo', () => {
      // Arrange
      const validator = new NumericValidator('age', { min: 18 });

      // Act
      const resultInvalid = validator.validate({ age: 17 });
      const resultValid = validator.validate({ age: 18 });

      // Assert
      expect(resultInvalid.valid).toBe(false);
      expect(resultInvalid.errors[0]?.code).toBe('MIN_VALUE');
      expect(resultValid.valid).toBe(true);
    });

    it('deve validar valor máximo', () => {
      // Arrange
      const validator = new NumericValidator('score', { max: 100 });

      // Act
      const resultInvalid = validator.validate({ score: 101 });
      const resultValid = validator.validate({ score: 100 });

      // Assert
      expect(resultInvalid.valid).toBe(false);
      expect(resultInvalid.errors[0]?.code).toBe('MAX_VALUE');
      expect(resultValid.valid).toBe(true);
    });

    it('deve validar se é inteiro', () => {
      // Arrange
      const validator = new NumericValidator('quantity', { integer: true });

      // Act
      const resultInvalid = validator.validate({ quantity: 10.5 });
      const resultValid = validator.validate({ quantity: 10 });

      // Assert
      expect(resultInvalid.valid).toBe(false);
      expect(resultInvalid.errors[0]?.code).toBe('NOT_INTEGER');
      expect(resultValid.valid).toBe(true);
    });
  });

  describe('CustomValidator', () => {
    it('deve executar função de validação customizada', () => {
      // Arrange
      const validator = new CustomValidator((data) => {
        if (data.password !== data.confirmPassword) {
          return {
            valid: false,
            errors: [
              {
                field: 'confirmPassword',
                message: 'Passwords do not match',
                code: 'PASSWORD_MISMATCH',
              },
            ],
          };
        }
        return { valid: true, errors: [] };
      });

      // Act
      const resultInvalid = validator.validate({
        password: 'abc123',
        confirmPassword: 'xyz789',
      });
      const resultValid = validator.validate({
        password: 'abc123',
        confirmPassword: 'abc123',
      });

      // Assert
      expect(resultInvalid.valid).toBe(false);
      expect(resultValid.valid).toBe(true);
    });
  });

  describe('ValidationChain', () => {
    it('deve executar múltiplos validators em cadeia', async () => {
      // Arrange
      const chain = new ValidationChain()
        .add(new RequiredValidator('name'))
        .add(new LengthValidator('name', { min: 3, max: 50 }));

      // Act
      const result = await chain.validate({ name: 'Jo' });

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('MIN_LENGTH');
    });

    it('deve passar quando todos os validators estão ok', async () => {
      // Arrange
      const chain = new ValidationChain()
        .add(new RequiredValidator('email'))
        .add(new PatternValidator('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/));

      // Act
      const result = await chain.validate({ email: 'test@example.com' });

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve coletar todos os erros quando stopOnFirstError é false', async () => {
      // Arrange
      const chain = new ValidationChain()
        .add(new RequiredValidator('name'))
        .add(new RequiredValidator('email'))
        .add(new RequiredValidator('phone'));

      // Act
      const result = await chain.validate({}, { stopOnFirstError: false });

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });

    it('deve parar no primeiro erro quando stopOnFirstError é true', async () => {
      // Arrange
      const chain = new ValidationChain()
        .add(new RequiredValidator('name'))
        .add(new RequiredValidator('email'))
        .add(new RequiredValidator('phone'));

      // Act
      const result = await chain.validate({}, { stopOnFirstError: true });

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('deve lançar ValidationException em validateOrThrow', async () => {
      // Arrange
      const chain = new ValidationChain().add(new RequiredValidator('name'));

      // Act & Assert
      await expect(chain.validateOrThrow({})).rejects.toThrow(
        ValidationException
      );
    });

    it('não deve lançar exception quando válido', async () => {
      // Arrange
      const chain = new ValidationChain().add(new RequiredValidator('name'));

      // Act & Assert
      await expect(
        chain.validateOrThrow({ name: 'John' })
      ).resolves.not.toThrow();
    });

    it('deve validar cenário complexo', async () => {
      // Arrange
      const chain = new ValidationChain()
        .add(new RequiredValidator('username'))
        .add(new LengthValidator('username', { min: 3, max: 20 }))
        .add(new RequiredValidator('password'))
        .add(new LengthValidator('password', { min: 8 }))
        .add(new NumericValidator('age', { min: 18, max: 120 }))
        .add(
          new PatternValidator('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        );

      // Act
      const result = await chain.validate({
        username: 'john_doe',
        password: 'securepass123',
        age: 25,
        email: 'john@example.com',
      });

      // Assert
      expect(result.valid).toBe(true);
    });
  });

  describe('ValidationException', () => {
    it('deve conter erros de validação', () => {
      // Arrange
      const errors = [
        { field: 'name', message: 'Name is required', code: 'REQUIRED' },
        { field: 'email', message: 'Email is invalid', code: 'INVALID_EMAIL' },
      ];

      // Act
      const exception = new ValidationException(errors);

      // Assert
      expect(exception.errors).toEqual(errors);
      expect(exception.message).toContain('Name is required');
      expect(exception.message).toContain('Email is invalid');
    });
  });
});
