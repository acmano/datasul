// src/shared/utils/serviceHelpers.ts

import { DatabaseError } from '@shared/errors/CustomErrors';
import { log } from '@shared/utils/logger';

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    entityName: string;
    codeFieldName: string;
    codeValue: string;
    operationName?: string;
  },
  NotFoundErrorClass?: new (code: string) => Error
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (NotFoundErrorClass && error instanceof NotFoundErrorClass) {
      throw error;
    }

    const operationDesc = context.operationName || 'buscar informações';

    log.error(`Erro ao ${operationDesc}`, {
      [context.codeFieldName]: context.codeValue,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });

    throw new DatabaseError(
      `Falha ao ${operationDesc} de ${context.entityName}`,
      error instanceof Error ? error : undefined
    );
  }
}

export function validateEntityExists<T>(
  entity: T | null,
  NotFoundErrorClass: new (code: string) => Error,
  codeFieldName: string,
  codeValue: string,
  entityName: string,
  gender: 'M' | 'F' = 'F' // ← NOVO: gênero padrão feminino
): asserts entity is T {
  if (!entity) {
    const suffix = gender === 'M' ? 'não encontrado' : 'não encontrada';
    log.info(`${entityName} ${suffix}`, { [codeFieldName]: codeValue });
    throw new NotFoundErrorClass(codeValue);
  }
}
