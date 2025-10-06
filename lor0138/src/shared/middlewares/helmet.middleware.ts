// src/shared/middlewares/helmet.middleware.ts

/**
 * @fileoverview Middleware de segurança com Helmet.js
 *
 * @description
 * Implementa proteções de segurança através de headers HTTP usando a biblioteca
 * Helmet.js. Protege contra vulnerabilidades comuns como XSS, Clickjacking,
 * MIME sniffing e outros ataques web.
 *
 * PROTEÇÕES IMPLEMENTADAS:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking (X-Frame-Options)
 * - MIME Type Sniffing
 * - DNS Prefetch Control
 * - HSTS (HTTP Strict Transport Security)
 * - Content Security Policy (CSP)
 * - Information Disclosure (remove headers sensíveis)
 *
 * @module shared/middlewares/helmet
 *
 * @requires helmet
 *
 * @see {@link https://helmetjs.github.io/}
 * @see {@link https://owasp.org/www-project-secure-headers/}
 */

import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// ====================================================================
// CONFIGURAÇÃO PRINCIPAL DO HELMET
// ====================================================================

/**
 * Middleware principal de segurança usando Helmet.js
 *
 * @description
 * Configura múltiplos headers de segurança através de uma única
 * configuração centralizada do Helmet. Protege contra as vulnerabilidades
 * mais comuns da web.
 *
 * @constant
 * @type {import('helmet').HelmetMiddleware}
 *
 * @example
 * ```typescript
 * // No app.ts
 * import { helmetMiddleware } from '@shared/middlewares/helmet.middleware';
 *
 * app.use(helmetMiddleware);
 * ```
 *
 * CONFIGURAÇÕES:
 *
 * 1. Content Security Policy (CSP):
 *    - Define fontes permitidas para scripts, estilos, imagens, etc
 *    - Previne XSS e injeção de código malicioso
 *    - Configurado para permitir apenas recursos do próprio domínio
 *
 * 2. HTTP Strict Transport Security (HSTS):
 *    - Força uso de HTTPS por 1 ano (31536000 segundos)
 *    - Inclui subdomínios
 *    - Habilitado para preload em navegadores
 *    - ⚠️ Desabilite em desenvolvimento local sem HTTPS
 *
 * 3. Hide Powered-By:
 *    - Remove header X-Powered-By que expõe tecnologia
 *    - Previne information disclosure
 *
 * 4. Frameguard:
 *    - Previne clickjacking
 *    - Bloqueia incorporação em frames/iframes
 *
 * 5. No Sniff:
 *    - Previne MIME type sniffing
 *    - Força navegador a respeitar Content-Type declarado
 *
 * 6. XSS Filter:
 *    - Ativa filtro XSS do navegador (legacy)
 *    - Ainda útil para navegadores antigos
 *
 * 7. DNS Prefetch Control:
 *    - Desabilita DNS prefetching
 *    - Melhora privacidade
 *
 * 8. Referrer Policy:
 *    - Controla informações de referência enviadas
 *    - Configurado como 'strict-origin-when-cross-origin'
 *
 * @remarks
 * IMPORTANTE:
 * - Deve ser um dos primeiros middlewares registrados
 * - Em produção com HTTPS, mantenha HSTS habilitado
 * - Em desenvolvimento sem HTTPS, desabilite HSTS
 * - CSP pode quebrar funcionalidades se mal configurado
 * - Teste headers com: curl -I http://localhost:3000/health
 *
 * AMBIENTES:
 * - Produção: Todas as proteções ativas
 * - Desenvolvimento: Considere desabilitar HSTS se não usar HTTPS
 *
 * COMPATIBILIDADE:
 * - Funciona com todos os navegadores modernos
 * - Headers ignorados por navegadores que não suportam
 */
export const helmetMiddleware = helmet({
  // ====================================================================
  // CONTENT SECURITY POLICY (CSP)
  // ====================================================================

  /**
   * Content Security Policy - Define fontes permitidas de conteúdo
   *
   * @description
   * Maior proteção contra XSS ao definir explicitamente quais fontes
   * de conteúdo são confiáveis. Previne execução de scripts maliciosos
   * e carregamento de recursos não autorizados.
   *
   * DIRETIVAS:
   * - defaultSrc: Fallback para outras diretivas não especificadas
   * - styleSrc: Fontes de CSS (permite inline para compatibilidade)
   * - scriptSrc: Fontes de JavaScript (apenas próprio domínio)
   * - imgSrc: Fontes de imagens (próprio domínio + data URIs + HTTPS)
   * - connectSrc: Destinos de fetch/XHR/WebSocket
   * - fontSrc: Fontes de tipografia
   * - objectSrc: Plugins como Flash (bloqueado)
   * - mediaSrc: Fontes de audio/video
   * - frameSrc: Fontes de iframes (bloqueado)
   */
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

  // ====================================================================
  // HTTP STRICT TRANSPORT SECURITY (HSTS)
  // ====================================================================

  /**
   * HSTS - Força uso de HTTPS
   *
   * @description
   * Instrui navegadores a acessarem o site apenas via HTTPS pelo
   * período especificado. Previne downgrade attacks e man-in-the-middle.
   *
   * CONFIGURAÇÃO:
   * - maxAge: 31536000 (1 ano em segundos)
   * - includeSubDomains: Aplica a subdomínios também
   * - preload: Permite inclusão na HSTS preload list dos navegadores
   *
   * ⚠️ ATENÇÃO:
   * - Desabilite em desenvolvimento local se não usar HTTPS
   * - Uma vez ativado, navegadores forçarão HTTPS pelo período definido
   * - Para reverter, é necessário enviar maxAge=0
   */
  hsts: {
    maxAge: 31536000, // 1 ano em segundos
    includeSubDomains: true,
    preload: true,
  },

  // ====================================================================
  // HEADERS DE PROTEÇÃO
  // ====================================================================

  /**
   * Remove header X-Powered-By
   *
   * @description
   * Remove header que expõe tecnologia do servidor (Express).
   * Reduz information disclosure para potenciais atacantes.
   */
  hidePoweredBy: true,

  /**
   * Frameguard - Previne clickjacking
   *
   * @description
   * Adiciona header X-Frame-Options: DENY.
   * Impede que a página seja carregada em frames/iframes,
   * prevenindo ataques de clickjacking.
   *
   * OPÇÕES:
   * - 'deny': Bloqueia completamente
   * - 'sameorigin': Permite apenas do mesmo domínio
   */
  frameguard: {
    action: 'deny',
  },

  /**
   * No Sniff - Previne MIME type sniffing
   *
   * @description
   * Adiciona header X-Content-Type-Options: nosniff.
   * Impede navegador de "adivinhar" tipo MIME, forçando
   * respeito ao Content-Type declarado.
   */
  noSniff: true,

  /**
   * XSS Filter - Ativa proteção XSS do navegador
   *
   * @description
   * Adiciona header X-XSS-Protection: 1; mode=block.
   * Ativa filtro XSS embutido nos navegadores (legacy).
   * Ainda útil para suportar navegadores antigos.
   */
  xssFilter: true,

  /**
   * DNS Prefetch Control - Controla prefetching
   *
   * @description
   * Desabilita DNS prefetching para melhorar privacidade.
   * Previne que navegador resolva DNS de links antes do clique.
   */
  dnsPrefetchControl: {
    allow: false,
  },

  /**
   * Referrer Policy - Controla informações de referência
   *
   * @description
   * Define política de envio de header Referer em navegação.
   * 'strict-origin-when-cross-origin' envia URL completa apenas
   * para mesmo domínio, e apenas origem para outros domínios.
   */
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

// ====================================================================
// HEADERS DE SEGURANÇA CUSTOMIZADOS
// ====================================================================

/**
 * Middleware adicional para headers de segurança customizados
 *
 * @description
 * Complementa o Helmet com headers adicionais específicos da aplicação
 * e garante que headers sensíveis sejam removidos.
 *
 * @param {Request} _req - Objeto de requisição (não utilizado)
 * @param {Response} res - Objeto de resposta do Express
 * @param {NextFunction} next - Função para próximo middleware
 *
 * @returns {void}
 *
 * @public
 *
 * @example
 * ```typescript
 * // No app.ts, após helmetMiddleware
 * import {
 *   helmetMiddleware,
 *   customSecurityHeaders
 * } from '@shared/middlewares/helmet.middleware';
 *
 * app.use(helmetMiddleware);
 * app.use(customSecurityHeaders);
 * ```
 *
 * HEADERS ADICIONADOS:
 *
 * 1. X-Frame-Options: DENY
 *    - Reforça proteção contra clickjacking
 *    - Redundante com Frameguard, mas garante compatibilidade
 *
 * 2. Permissions-Policy
 *    - Desabilita APIs perigosas do navegador
 *    - Bloqueia: geolocation, microphone, camera, payment, usb
 *    - Melhora privacidade e segurança
 *
 * 3. Remove Headers Sensíveis
 *    - X-Powered-By: Expõe tecnologia
 *    - Server: Expõe versão do servidor
 *
 * @remarks
 * - Sempre use após helmetMiddleware
 * - Headers são adicionados a todas as respostas
 * - Não interfere no fluxo da requisição
 */
export const customSecurityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Adiciona headers personalizados específicos da aplicação

  /**
   * X-Frame-Options - Reforça proteção contra clickjacking
   * Redundante mas garante compatibilidade com navegadores antigos
   */
  res.setHeader('X-Frame-Options', 'DENY');

  /**
   * Permissions-Policy (Feature Policy)
   * Desabilita APIs perigosas do navegador que a aplicação não usa
   *
   * APIs bloqueadas:
   * - geolocation: Localização GPS
   * - microphone: Acesso ao microfone
   * - camera: Acesso à câmera
   * - payment: Payment Request API
   * - usb: WebUSB API
   */
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
  );

  /**
   * Remove informações de servidor
   * Previne information disclosure sobre tecnologias usadas
   */
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};

// ====================================================================
// CONFIGURAÇÕES POR AMBIENTE
// ====================================================================

/**
 * Retorna configuração do Helmet baseada no ambiente
 *
 * @description
 * Factory function que retorna configuração apropriada do Helmet
 * dependendo do ambiente (development/production). Permite desabilitar
 * HSTS em desenvolvimento local sem HTTPS.
 *
 * @param {string} environment - Ambiente de execução (development/production/test)
 * @returns {object} Configuração do Helmet
 *
 * @public
 *
 * @example
 * ```typescript
 * // Para usar configuração dinâmica por ambiente
 * import { getHelmetConfig } from '@shared/middlewares/helmet.middleware';
 *
 * const helmetConfig = getHelmetConfig(process.env.NODE_ENV);
 * app.use(helmet(helmetConfig));
 * ```
 *
 * AMBIENTES:
 * - production: Todas as proteções ativas, incluindo HSTS
 * - development: HSTS desabilitado (útil sem HTTPS local)
 * - test: Similar ao development
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
    // HSTS apenas em produção (desenvolvimento pode não ter HTTPS)
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

// ====================================================================
// UTILITÁRIOS DE TESTE
// ====================================================================

/**
 * Lista todos os headers de segurança que devem estar presentes
 *
 * @description
 * Retorna array com todos os headers de segurança implementados.
 * Útil para testes automatizados e validação.
 *
 * @returns {string[]} Array com nomes dos headers
 *
 * @public
 *
 * @example
 * ```typescript
 * import { getSecurityHeaders } from '@shared/middlewares/helmet.middleware';
 *
 * const headers = getSecurityHeaders();
 * // ['Content-Security-Policy', 'Strict-Transport-Security', ...]
 *
 * // Em teste
 * headers.forEach(header => {
 *   expect(response.headers).toHaveProperty(header.toLowerCase());
 * });
 * ```
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