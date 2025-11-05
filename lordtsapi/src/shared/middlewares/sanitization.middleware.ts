/**
 * Input Sanitization Middleware
 * Protege contra XSS, SQL Injection e outros ataques
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '@shared/utils/logger';

/**
 * Classe utilitária para sanitização de inputs
 */
export class Sanitizer {
  /**
   * Remove tags HTML e scripts (XSS protection)
   */
  static sanitizeHTML(input: string): string {
    if (typeof input !== 'string') return input;

    return (
      input
        // Remove script tags e conteúdo
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove event handlers (onclick, onerror, etc)
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Remove data: protocol (pode conter base64 malicioso)
        .replace(/data:text\/html/gi, '')
        // Remove outras tags HTML perigosas
        .replace(/<iframe[^>]*>/gi, '')
        .replace(/<object[^>]*>/gi, '')
        .replace(/<embed[^>]*>/gi, '')
        .replace(/<link[^>]*>/gi, '')
    );
  }

  /**
   * Escape SQL LIKE wildcards para prevenir injection
   */
  static escapeSQLLike(input: string): string {
    if (typeof input !== 'string') return input;
    return input.replace(/[%_[\]]/g, '\\$&');
  }

  /**
   * Remove caracteres perigosos para SQL
   */
  static sanitizeSQL(input: string): string {
    if (typeof input !== 'string') return input;

    // Remove ou escapa caracteres perigosos
    return input
      .replace(/--/g, '') // Remove SQL comments
      .replace(/;/g, '') // Remove statement terminators
      .replace(/\/\*/g, '') // Remove multiline comment start
      .replace(/\*\//g, ''); // Remove multiline comment end
  }

  /**
   * Normaliza espaços em branco
   */
  static normalizeWhitespace(input: string): string {
    if (typeof input !== 'string') return input;

    return input
      .replace(/\s+/g, ' ') // Múltiplos espaços -> 1 espaço
      .trim(); // Remove espaços nas pontas
  }

  /**
   * Remove caracteres de controle (exceto \n, \r, \t)
   */
  static removeControlChars(input: string): string {
    if (typeof input !== 'string') return input;

    // Remove caracteres de controle ASCII 0-31 exceto tab, newline, carriage return
    // eslint-disable-next-line no-control-regex
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  /**
   * Sanitiza string completa (todas as proteções)
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return input;

    let sanitized = input;
    sanitized = this.removeControlChars(sanitized);
    sanitized = this.sanitizeHTML(sanitized);
    sanitized = this.normalizeWhitespace(sanitized);
    return sanitized;
  }

  /**
   * Sanitiza objeto recursivamente
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = {} as T;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key as keyof T] = this.sanitizeString(value) as T[keyof T];
      } else if (Array.isArray(value)) {
        sanitized[key as keyof T] = value.map((item) =>
          typeof item === 'string'
            ? this.sanitizeString(item)
            : typeof item === 'object'
              ? this.sanitizeObject(item)
              : item
        ) as T[keyof T];
      } else if (value && typeof value === 'object') {
        sanitized[key as keyof T] = this.sanitizeObject(value);
      } else {
        sanitized[key as keyof T] = value;
      }
    }

    return sanitized;
  }

  /**
   * Valida se string contém apenas caracteres permitidos
   */
  static isAlphanumeric(input: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(input);
  }

  /**
   * Valida se string é um código válido (letras, números, hífen)
   */
  static isValidCode(input: string): boolean {
    return /^[a-zA-Z0-9-]+$/.test(input);
  }

  /**
   * Detecta tentativas de SQL injection
   */
  static detectSQLInjection(input: string): boolean {
    if (typeof input !== 'string') return false;

    const sqlPatterns = [
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\bSELECT\b.*\bFROM\b)/i,
      /(\bINSERT\b.*\bINTO\b)/i,
      /(\bDELETE\b.*\bFROM\b)/i,
      /(\bUPDATE\b.*\bSET\b)/i,
      /(\bDROP\b.*\bTABLE\b)/i,
      /(\bEXEC\b|\bEXECUTE\b)/i,
      /(;.*--)/,
      /('.*OR.*'.*=.*')/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Detecta tentativas de XSS
   */
  static detectXSS(input: string): boolean {
    if (typeof input !== 'string') return false;

    const xssPatterns = [
      /<script[^>]*>.*<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }
}

/**
 * Middleware para sanitizar automaticamente todos os inputs
 */
export function sanitizeInputs(req: Request, res: Response, next: NextFunction): void {
  try {
    // Sanitiza body
    if (req.body && typeof req.body === 'object') {
      const original = JSON.stringify(req.body);
      req.body = Sanitizer.sanitizeObject(req.body);
      const sanitized = JSON.stringify(req.body);

      if (original !== sanitized) {
        log.debug('Input sanitized', {
          correlationId: req.id,
          type: 'body',
          changed: true,
        });
      }
    }

    // Sanitiza query
    if (req.query && typeof req.query === 'object') {
      req.query = Sanitizer.sanitizeObject(req.query as any);
    }

    // Sanitiza params
    if (req.params && typeof req.params === 'object') {
      req.params = Sanitizer.sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    log.error('Error sanitizing inputs', {
      correlationId: req.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

/**
 * Middleware para bloquear tentativas óbvias de ataque
 */
export function blockMaliciousInputs(req: Request, res: Response, next: NextFunction): void {
  const checkValue = (value: any, path: string): boolean => {
    if (typeof value === 'string') {
      // Detecta SQL Injection
      if (Sanitizer.detectSQLInjection(value)) {
        log.warn('SQL Injection attempt blocked', {
          correlationId: req.id,
          path,
          value: value.substring(0, 100),
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return true;
      }

      // Detecta XSS
      if (Sanitizer.detectXSS(value)) {
        log.warn('XSS attempt blocked', {
          correlationId: req.id,
          path,
          value: value.substring(0, 100),
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return true;
      }
    } else if (value && typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        if (checkValue(val, `${path}.${key}`)) {
          return true;
        }
      }
    }

    return false;
  };

  // Verifica body
  if (req.body && checkValue(req.body, 'body')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MALICIOUS_INPUT',
        message: 'Entrada maliciosa detectada e bloqueada',
      },
      correlationId: req.id,
    });
    return;
  }

  // Verifica query
  if (req.query && checkValue(req.query, 'query')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MALICIOUS_INPUT',
        message: 'Entrada maliciosa detectada e bloqueada',
      },
      correlationId: req.id,
    });
    return;
  }

  // Verifica params
  if (req.params && checkValue(req.params, 'params')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MALICIOUS_INPUT',
        message: 'Entrada maliciosa detectada e bloqueada',
      },
      correlationId: req.id,
    });
    return;
  }

  next();
}
