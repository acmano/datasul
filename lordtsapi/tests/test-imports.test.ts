// tests/test-imports.test.ts
import { validateItemInformacoesGeraisRequest } from '@/item/dadosCadastrais/informacoesGerais/validators';

describe('Test Imports', () => {
  test('should import validator successfully', () => {
    expect(validateItemInformacoesGeraisRequest).toBeDefined();
  });

  test('validator should work', () => {
    const result = validateItemInformacoesGeraisRequest({ itemCodigo: '7530110' });
    expect(result.valid).toBe(true);
  });
});