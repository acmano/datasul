/**
 * Testes para Sanitization Middleware
 */

import { Request, Response } from 'express';
import { Sanitizer, sanitizeInputs, blockMaliciousInputs } from '../sanitization.middleware';

describe('Sanitizer', () => {
  describe('sanitizeHTML', () => {
    it('deve remover tags script', () => {
      const input = 'Texto<script>alert("XSS")</script>limpo';
      const output = Sanitizer.sanitizeHTML(input);
      expect(output).not.toContain('<script>');
      expect(output).toContain('Textolimpo');
    });

    it('deve remover event handlers', () => {
      const input = '<div onclick="malicious()">Texto</div>';
      const output = Sanitizer.sanitizeHTML(input);
      expect(output).not.toContain('onclick');
    });

    it('deve remover javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const output = Sanitizer.sanitizeHTML(input);
      expect(output).not.toContain('javascript:');
    });

    it('deve remover iframes', () => {
      const input = 'Texto<iframe src="evil.com"></iframe>limpo';
      const output = Sanitizer.sanitizeHTML(input);
      expect(output).not.toContain('<iframe');
    });

    it('deve manter texto normal intacto', () => {
      const input = 'Texto normal sem HTML';
      const output = Sanitizer.sanitizeHTML(input);
      expect(output).toBe(input);
    });
  });

  describe('escapeSQLLike', () => {
    it('deve escapar wildcards %', () => {
      const input = 'test%value';
      const output = Sanitizer.escapeSQLLike(input);
      expect(output).toBe('test\\%value');
    });

    it('deve escapar wildcards _', () => {
      const input = 'test_value';
      const output = Sanitizer.escapeSQLLike(input);
      expect(output).toBe('test\\_value');
    });

    it('deve escapar múltiplos wildcards', () => {
      const input = 'te%st_va%lue';
      const output = Sanitizer.escapeSQLLike(input);
      expect(output).toBe('te\\%st\\_va\\%lue');
    });
  });

  describe('sanitizeSQL', () => {
    it('deve remover comentários SQL --', () => {
      const input = 'SELECT * FROM users -- comment';
      const output = Sanitizer.sanitizeSQL(input);
      expect(output).not.toContain('--');
    });

    it('deve remover statement terminators', () => {
      const input = 'SELECT * FROM users;';
      const output = Sanitizer.sanitizeSQL(input);
      expect(output).not.toContain(';');
    });

    it('deve remover comentários multiline', () => {
      const input = 'SELECT /* comment */ * FROM users';
      const output = Sanitizer.sanitizeSQL(input);
      expect(output).not.toContain('/*');
      expect(output).not.toContain('*/');
    });
  });

  describe('normalizeWhitespace', () => {
    it('deve remover múltiplos espaços', () => {
      const input = 'texto    com     espaços';
      const output = Sanitizer.normalizeWhitespace(input);
      expect(output).toBe('texto com espaços');
    });

    it('deve fazer trim', () => {
      const input = '  texto  ';
      const output = Sanitizer.normalizeWhitespace(input);
      expect(output).toBe('texto');
    });
  });

  describe('removeControlChars', () => {
    it('deve remover caracteres de controle', () => {
      const input = 'texto\x00com\x01controle';
      const output = Sanitizer.removeControlChars(input);
      expect(output).toBe('textocomcontrole');
    });

    it('deve manter \\n, \\r, \\t', () => {
      const input = 'linha1\nlinha2\rtab\taqui';
      const output = Sanitizer.removeControlChars(input);
      expect(output).toContain('\n');
      expect(output).toContain('\r');
      expect(output).toContain('\t');
    });
  });

  describe('sanitizeObject', () => {
    it('deve sanitizar strings em objeto', () => {
      const input = {
        name: '<script>alert(1)</script>John',
        age: 30,
      };
      const output = Sanitizer.sanitizeObject(input);
      expect(output.name).not.toContain('<script>');
      expect(output.age).toBe(30);
    });

    it('deve sanitizar objetos nested', () => {
      const input = {
        user: {
          name: '<b>John</b>',
          data: {
            description: '<script>evil</script>Safe',
          },
        },
      };
      const output = Sanitizer.sanitizeObject(input);
      expect(output.user.name).not.toContain('<b>');
      expect(output.user.data.description).not.toContain('<script>');
      expect(output.user.data.description).toContain('Safe');
    });

    it('deve sanitizar arrays', () => {
      const input = {
        items: ['<script>bad</script>item1', 'item2'],
      };
      const output = Sanitizer.sanitizeObject(input);
      expect(output.items[0]).not.toContain('<script>');
      expect(output.items[1]).toBe('item2');
    });
  });

  describe('detectSQLInjection', () => {
    it('deve detectar UNION SELECT', () => {
      const input = "' UNION SELECT * FROM users --";
      expect(Sanitizer.detectSQLInjection(input)).toBe(true);
    });

    it('deve detectar OR 1=1', () => {
      const input = "' OR '1'='1";
      expect(Sanitizer.detectSQLInjection(input)).toBe(true);
    });

    it('deve detectar DROP TABLE', () => {
      const input = '; DROP TABLE users; --';
      expect(Sanitizer.detectSQLInjection(input)).toBe(true);
    });

    it('não deve detectar falso positivo em texto normal', () => {
      const input = 'SELECT a product FROM the store';
      expect(Sanitizer.detectSQLInjection(input)).toBe(false);
    });
  });

  describe('detectXSS', () => {
    it('deve detectar script tags', () => {
      const input = '<script>alert(1)</script>';
      expect(Sanitizer.detectXSS(input)).toBe(true);
    });

    it('deve detectar javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      expect(Sanitizer.detectXSS(input)).toBe(true);
    });

    it('deve detectar event handlers', () => {
      const input = '<img onerror="alert(1)">';
      expect(Sanitizer.detectXSS(input)).toBe(true);
    });

    it('não deve detectar falso positivo', () => {
      const input = 'I love JavaScript programming';
      expect(Sanitizer.detectXSS(input)).toBe(false);
    });
  });

  describe('isValidCode', () => {
    it('deve aceitar código válido', () => {
      expect(Sanitizer.isValidCode('ITEM001')).toBe(true);
      expect(Sanitizer.isValidCode('PROD-123')).toBe(true);
    });

    it('deve rejeitar caracteres especiais', () => {
      expect(Sanitizer.isValidCode('ITEM<001')).toBe(false);
      expect(Sanitizer.isValidCode('ITEM;DROP')).toBe(false);
    });
  });
});

describe('sanitizeInputs middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      id: 'test-correlation-id',
      body: {},
      query: {},
      params: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('deve sanitizar req.body', () => {
    mockReq.body = {
      name: '<script>alert(1)</script>John',
    };

    sanitizeInputs(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.body.name).not.toContain('<script>');
    expect(mockNext).toHaveBeenCalled();
  });

  it('deve sanitizar req.query', () => {
    mockReq.query = {
      search: '<b>test</b>',
    };

    sanitizeInputs(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.query.search).not.toContain('<b>');
    expect(mockNext).toHaveBeenCalled();
  });

  it('deve sanitizar req.params', () => {
    mockReq.params = {
      id: '<script>bad</script>123',
    };

    sanitizeInputs(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.params.id).not.toContain('<script>');
    expect(mockNext).toHaveBeenCalled();
  });

  it('deve chamar next mesmo sem dados para sanitizar', () => {
    sanitizeInputs(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('blockMaliciousInputs middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockReq = {
      id: 'test-correlation-id',
      ip: '127.0.0.1',
      body: {},
      query: {},
      params: {},
      get: jest.fn(),
    };

    mockRes = {
      status: mockStatus,
    };

    mockNext = jest.fn();
  });

  it('deve bloquear SQL injection em body', () => {
    mockReq.body = {
      username: "admin' OR '1'='1",
    };

    blockMaliciousInputs(mockReq as Request, mockRes as Response, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'MALICIOUS_INPUT',
        }),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('deve bloquear XSS em query', () => {
    mockReq.query = {
      search: '<script>alert(1)</script>',
    };

    blockMaliciousInputs(mockReq as Request, mockRes as Response, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('deve permitir inputs válidos', () => {
    mockReq.body = {
      name: 'John Doe',
      age: 30,
    };

    blockMaliciousInputs(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it('deve bloquear ataque em objeto nested', () => {
    mockReq.body = {
      user: {
        profile: {
          bio: "'; DROP TABLE users; --",
        },
      },
    };

    blockMaliciousInputs(mockReq as Request, mockRes as Response, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
