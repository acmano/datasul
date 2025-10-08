// @ts-nocheck
// src/shared/middlewares/compression.middleware.ts
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import compression from 'compression';
import { Request, Response } from 'express';

/**
 * Middleware de compressão de respostas
 * 
 * Comprime respostas usando gzip/deflate/brotli
 * Reduz drasticamente o tamanho de respostas JSON
 * 
 * Benefícios:
 * - Reduz bandwidth em até 80%
 * - Respostas mais rápidas
 * - Menor custo de transferência
 * - Melhor experiência do usuário
 */

/**
 * Função que decide se deve comprimir a resposta
 * Por padrão, comprime apenas se o cliente suportar
 */
function shouldCompress(req: Request, res: Response): boolean {
  if (stryMutAct_9fa48("2514")) {
    {}
  } else {
    stryCov_9fa48("2514");
    // Se a resposta já tem Content-Encoding, não comprime
    if (stryMutAct_9fa48("2516") ? false : stryMutAct_9fa48("2515") ? true : (stryCov_9fa48("2515", "2516"), res.getHeader(stryMutAct_9fa48("2517") ? "" : (stryCov_9fa48("2517"), 'Content-Encoding')))) {
      if (stryMutAct_9fa48("2518")) {
        {}
      } else {
        stryCov_9fa48("2518");
        return stryMutAct_9fa48("2519") ? true : (stryCov_9fa48("2519"), false);
      }
    }

    // Se o cliente não suporta compressão, não comprime
    if (stryMutAct_9fa48("2522") ? false : stryMutAct_9fa48("2521") ? true : stryMutAct_9fa48("2520") ? req.headers['accept-encoding'] : (stryCov_9fa48("2520", "2521", "2522"), !req.headers[stryMutAct_9fa48("2523") ? "" : (stryCov_9fa48("2523"), 'accept-encoding')])) {
      if (stryMutAct_9fa48("2524")) {
        {}
      } else {
        stryCov_9fa48("2524");
        return stryMutAct_9fa48("2525") ? true : (stryCov_9fa48("2525"), false);
      }
    }

    // Usa a função padrão do compression para decidir
    return stryMutAct_9fa48("2526") ? compression : (stryCov_9fa48("2526"), compression.filter(req, res));
  }
}

/**
 * Middleware de compressão configurado
 */
export const compressionMiddleware = compression(stryMutAct_9fa48("2527") ? {} : (stryCov_9fa48("2527"), {
  // Função que decide se comprime
  filter: shouldCompress,
  // Nível de compressão (0-9)
  // 6 é um bom equilíbrio entre velocidade e compressão
  level: 6,
  // Tamanho mínimo para comprimir (em bytes)
  // Respostas menores que 1KB não vale a pena comprimir
  threshold: 1024,
  // Tamanho do buffer de memória (16KB padrão)
  memLevel: 8,
  // Strategy de compressão
  // Z_DEFAULT_STRATEGY é bom para a maioria dos casos
  strategy: 0
}));

/**
 * Configuração alternativa para compressão agressiva
 * Use apenas se banda é mais importante que CPU
 */
export const aggressiveCompression = compression(stryMutAct_9fa48("2528") ? {} : (stryCov_9fa48("2528"), {
  filter: shouldCompress,
  level: 9,
  // Máxima compressão (mais CPU)
  threshold: 512,
  // Comprime a partir de 512 bytes
  memLevel: 9
}));