// src/api/lor0138/item/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators.ts

import { ItemInformacoesGeraisRequestDTO } from '../types/informacoesGerais.types';

/**
 * Sanitiza o código do item removendo caracteres perigosos
 */
function sanitizeItemCodigo(value: string): string {
  // Remove espaços em branco nas extremidades
  let sanitized = value.trim();
  
  // Remove caracteres de controle e não imprimíveis
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove tentativas de path traversal
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Remove caracteres SQL perigosos adicionais (redundante com prepared statements, mas seguro)
  sanitized = sanitized.replace(/[';"\-\-]/g, '');
  
  // Remove tags HTML/XML (prevenção XSS)
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  return sanitized;
}

/**
 * Valida formato do código do item
 */
function isValidItemCodigoFormat(value: string): boolean {
  // Permite apenas: letras e números
  // Caracteres permitidos: A-Z, a-z, 0-9
  const validPattern = /^[A-Za-z0-9]+$/;
  return validPattern.test(value);
}

/**
 * Valida os parâmetros de busca de informações gerais do item
 */
export function validateItemInformacoesGeraisRequest(
  data: any
): { valid: boolean; error?: string; data?: ItemInformacoesGeraisRequestDTO } {
  
  // 1. Verifica se itemCodigo foi fornecido
  if (!data.itemCodigo) {
    return {
      valid: false,
      error: 'Código do item é obrigatório',
    };
  }

  // 2. Valida tipo
  if (typeof data.itemCodigo !== 'string') {
    return {
      valid: false,
      error: 'Código do item deve ser uma string',
    };
  }

  // 3. Sanitiza
  const sanitized = sanitizeItemCodigo(data.itemCodigo);

  // 4. Valida se não ficou vazio após sanitização
  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Código do item inválido ou contém apenas caracteres não permitidos',
    };
  }

  // 5. Valida tamanho máximo
  if (sanitized.length > 16) {
    return {
      valid: false,
      error: 'Código do item não pode ter mais de 16 caracteres',
    };
  }

  // 6. Valida tamanho mínimo
  if (sanitized.length < 1) {
    return {
      valid: false,
      error: 'Código do item não pode estar vazio',
    };
  }

  // 7. Valida formato (caracteres permitidos)
  if (!isValidItemCodigoFormat(sanitized)) {
    return {
      valid: false,
      error: 'Código do item contém caracteres inválidos. Use apenas letras, números e caracteres básicos',
    };
  }

  // 8. Validações adicionais de segurança
  
  // Bloqueia tentativas óbvias de SQL injection
  const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'EXEC', 'UNION'];
  const upperSanitized = sanitized.toUpperCase();
  for (const keyword of sqlKeywords) {
    if (upperSanitized.includes(keyword)) {
      return {
        valid: false,
        error: 'Código do item contém padrões não permitidos',
      };
    }
  }

  // Bloqueia tentativas de command injection
  const dangerousPatterns = [
    '&&', '||', '|', '`', '$', '$(', '${',
  ];
  for (const pattern of dangerousPatterns) {
    if (sanitized.includes(pattern)) {
      return {
        valid: false,
        error: 'Código do item contém caracteres não permitidos',
      };
    }
  }

  // Tudo válido
  return {
    valid: true,
    data: { itemCodigo: sanitized },
  };
}