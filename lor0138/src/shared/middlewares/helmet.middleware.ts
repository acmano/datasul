// src/shared/middlewares/helmet.middleware.ts

/**
 * Middleware de segurança com Helmet.js
 *
 * @module shared/middlewares/helmet
 * @see helmet.middleware.md para documentação completa
 *
 * Proteções implementadas:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking (X-Frame-Options)
 * - MIME Type Sniffing
 * - DNS Prefetch Control
 * - HSTS (HTTP Strict Transport Security)
 * - CSP (Content Security Policy)
 * - Information Disclosure
 *
 * Exports:
 * - helmetMiddleware: Configuração principal
 * - customSecurityHeaders: Headers adicionais
 * - getHelmetConfig: Factory por ambiente
 * - getSecurityHeaders: Lista de headers (testes)
 */

import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// ============================================================================
// CONFIGURAÇÃO PRINCIPAL
// ============================================================================

/**
 * Middleware principal de segurança (Helmet)
 * Registrar como um dos primeiros middlewares
 */
export const helmetMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // HTTP Strict Transport Security (HSTS)
  // ⚠️ Desabilite em development sem HTTPS
  hsts: {
    maxAge: 31536000,        // 1 ano
    includeSubDomains: true,
    preload: true,
  },

  // Proteções gerais
  hidePoweredBy: true,
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  dnsPrefetchControl: { allow: false },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// ============================================================================
// HEADERS ADICIONAIS
// ============================================================================

/**
 * Headers de segurança customizados
 * Usar após helmetMiddleware
 */
export const customSecurityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // X-Frame-Options (reforça proteção)
  res.setHeader('X-Frame-Options', 'DENY');

  // Permissions-Policy (desabilita APIs perigosas)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
  );

  // Remove headers sensíveis
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};

// ============================================================================
// CONFIGURAÇÃO POR AMBIENTE
// ============================================================================

/**
 * Factory de configuração por ambiente
 * @param environment - 'development' | 'production' | 'test'
 */
export function getHelmetConfig(environment: string = 'production') {
  const isProduction = environment === 'production';

  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // HSTS apenas em produção
    hsts: isProduction
      ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
      : false,
    hidePoweredBy: true,
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    dnsPrefetchControl: { allow: false },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  };
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Lista headers de segurança implementados
 * Útil para testes automatizados
 */
export function getSecurityHeaders(): string[] {
  return [
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Permissions-Policy',
  ];
}