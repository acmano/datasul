// src/shared/middlewares/helmet.middleware.ts

import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Security Headers usando Helmet.js
 * 
 * Adiciona proteção contra:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME type sniffing
 * - DNS Prefetch Control
 * - Frame Options
 * - Powered-By header removal
 * - HSTS (HTTP Strict Transport Security)
 * - Content Security Policy
 */

export const helmetMiddleware = helmet({
  // Content Security Policy - Define fontes permitidas de conteúdo
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

  // HSTS - Force HTTPS (desabilite em desenvolvimento se não usar HTTPS)
  hsts: {
    maxAge: 31536000, // 1 ano em segundos
    includeSubDomains: true,
    preload: true,
  },

  // Remove o header X-Powered-By que revela tecnologia
  hidePoweredBy: true,

  // Previne clickjacking
  frameguard: {
    action: 'deny',
  },

  // Previne MIME type sniffing
  noSniff: true,

  // Força modo de proteção XSS do navegador
  xssFilter: true,

  // Controla DNS prefetching
  dnsPrefetchControl: {
    allow: false,
  },

  // Desabilita client-side caching para conteúdo sensível
  // Pode ajustar conforme necessário
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

/**
 * Middleware adicional para headers customizados
 */
export const customSecurityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Adiciona headers personalizados específicos da aplicação
  
  // Previne que a página seja incorporada em frames/iframes
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Adiciona política de permissões (Feature Policy/Permissions Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
  );
  
  // Remove informações de servidor
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
};