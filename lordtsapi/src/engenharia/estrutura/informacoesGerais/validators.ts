import { validateSecureCode } from '@shared/validators/secureCode.validator';
import { ValidationError } from '@shared/errors/errors';

/**
 * Valida o código do item
 */
export const validateItemCodigo = (itemCodigo: string): void => {
  if (!itemCodigo) {
    throw new ValidationError('Código do item é obrigatório', {
      field: 'itemCodigo',
      received: itemCodigo,
    });
  }

  if (typeof itemCodigo !== 'string') {
    throw new ValidationError('Código do item deve ser uma string', {
      field: 'itemCodigo',
      type: typeof itemCodigo,
    });
  }

  const trimmed = itemCodigo.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Código do item não pode ser vazio', {
      field: 'itemCodigo',
    });
  }

  // Validação de segurança contra SQL injection
  const validationResult = validateSecureCode(trimmed);
  if (!validationResult.valid) {
    throw new ValidationError(validationResult.error || 'Código do item inválido', {
      field: 'itemCodigo',
      received: trimmed,
    });
  }
};

/**
 * Valida a data de referência (formato ISO: YYYY-MM-DD)
 */
export const validateDataReferencia = (dataReferencia?: string): void => {
  if (!dataReferencia) {
    return; // Data é opcional
  }

  if (typeof dataReferencia !== 'string') {
    throw new ValidationError('Data de referência deve ser uma string', {
      field: 'dataReferencia',
      type: typeof dataReferencia,
    });
  }

  // Formato ISO: YYYY-MM-DD (exatamente 4-2-2 dígitos)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dataReferencia)) {
    throw new ValidationError('Data de referência deve estar no formato YYYY-MM-DD', {
      field: 'dataReferencia',
      received: dataReferencia,
      expected: 'YYYY-MM-DD',
    });
  }

  // Validar se é uma data válida
  const date = new Date(dataReferencia + 'T00:00:00');
  if (isNaN(date.getTime())) {
    throw new ValidationError('Data de referência inválida', {
      field: 'dataReferencia',
      received: dataReferencia,
    });
  }

  // Verificar se a data, quando convertida de volta, mantém o mesmo valor
  // Isso evita casos como '2025-02-30' que são interpretados como outra data
  const [year, month, day] = dataReferencia.split('-').map(Number);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    throw new ValidationError('Data de referência inválida', {
      field: 'dataReferencia',
      received: dataReferencia,
    });
  }

  // Validar que não é uma data futura muito distante (mais de 10 anos)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 10);

  if (date > maxDate) {
    throw new ValidationError('Data de referência muito distante no futuro', {
      field: 'dataReferencia',
      received: dataReferencia,
      maxDate: maxDate.toISOString().split('T')[0]!,
    });
  }

  // Validar que não é uma data muito antiga (antes de 1900)
  const minDate = new Date('1900-01-01');
  if (date < minDate) {
    throw new ValidationError('Data de referência muito antiga', {
      field: 'dataReferencia',
      received: dataReferencia,
      minDate: '1900-01-01',
    });
  }
};

/**
 * Valida todos os parâmetros de consulta
 */
export const validateConsultaParams = (itemCodigo: string, dataReferencia?: string): void => {
  validateItemCodigo(itemCodigo);
  validateDataReferencia(dataReferencia);
};
