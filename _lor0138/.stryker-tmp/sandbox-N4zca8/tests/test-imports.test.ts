// @ts-nocheck
// tests/test-imports.test.ts
import { validateItemInformacoesGeraisRequest } from '@api/lor0138/item/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators';

describe('Test Imports', () => {
  test('should import validator successfully', () => {
    expect(validateItemInformacoesGeraisRequest).toBeDefined();
  });

  test('validator should work', () => {
    const result = validateItemInformacoesGeraisRequest({ itemCodigo: '7530110' });
    expect(result.valid).toBe(true);
  });
});