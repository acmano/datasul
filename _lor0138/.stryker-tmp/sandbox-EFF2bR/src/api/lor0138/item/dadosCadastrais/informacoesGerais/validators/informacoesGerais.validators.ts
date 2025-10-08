// @ts-nocheck
// src/api/lor0138/item/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators.ts
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
import { ItemInformacoesGeraisRequestDTO } from '../types/informacoesGerais.types';

/**
 * Sanitiza o código do item removendo caracteres perigosos
 */
function sanitizeItemCodigo(value: string): string {
  if (stryMutAct_9fa48("209")) {
    {}
  } else {
    stryCov_9fa48("209");
    // Remove espaços em branco nas extremidades
    let sanitized = stryMutAct_9fa48("210") ? value : (stryCov_9fa48("210"), value.trim());

    // Remove caracteres de controle e não imprimíveis
    sanitized = sanitized.replace(stryMutAct_9fa48("211") ? /[^\x00-\x1F\x7F]/g : (stryCov_9fa48("211"), /[\x00-\x1F\x7F]/g), stryMutAct_9fa48("212") ? "Stryker was here!" : (stryCov_9fa48("212"), ''));

    // Remove tentativas de path traversal
    sanitized = sanitized.replace(/\.\./g, stryMutAct_9fa48("213") ? "Stryker was here!" : (stryCov_9fa48("213"), ''));
    sanitized = sanitized.replace(stryMutAct_9fa48("214") ? /[^\/\\]/g : (stryCov_9fa48("214"), /[\/\\]/g), stryMutAct_9fa48("215") ? "Stryker was here!" : (stryCov_9fa48("215"), ''));

    // Remove caracteres SQL perigosos adicionais (redundante com prepared statements, mas seguro)
    sanitized = sanitized.replace(stryMutAct_9fa48("216") ? /[^';"\-\-]/g : (stryCov_9fa48("216"), /[';"\-\-]/g), stryMutAct_9fa48("217") ? "Stryker was here!" : (stryCov_9fa48("217"), ''));

    // Remove tags HTML/XML (prevenção XSS)
    sanitized = sanitized.replace(stryMutAct_9fa48("219") ? /<[>]*>/g : stryMutAct_9fa48("218") ? /<[^>]>/g : (stryCov_9fa48("218", "219"), /<[^>]*>/g), stryMutAct_9fa48("220") ? "Stryker was here!" : (stryCov_9fa48("220"), ''));
    return sanitized;
  }
}

/**
 * Valida formato do código do item
 */
function isValidItemCodigoFormat(value: string): boolean {
  if (stryMutAct_9fa48("221")) {
    {}
  } else {
    stryCov_9fa48("221");
    // Permite apenas: letras e números
    // Caracteres permitidos: A-Z, a-z, 0-9
    const validPattern = stryMutAct_9fa48("225") ? /^[^A-Za-z0-9]+$/ : stryMutAct_9fa48("224") ? /^[A-Za-z0-9]$/ : stryMutAct_9fa48("223") ? /^[A-Za-z0-9]+/ : stryMutAct_9fa48("222") ? /[A-Za-z0-9]+$/ : (stryCov_9fa48("222", "223", "224", "225"), /^[A-Za-z0-9]+$/);
    return validPattern.test(value);
  }
}

/**
 * Valida os parâmetros de busca de informações gerais do item
 */
export function validateItemInformacoesGeraisRequest(data: any): {
  valid: boolean;
  error?: string;
  data?: ItemInformacoesGeraisRequestDTO;
} {
  if (stryMutAct_9fa48("226")) {
    {}
  } else {
    stryCov_9fa48("226");
    // 1. Verifica se itemCodigo foi fornecido
    if (stryMutAct_9fa48("229") ? false : stryMutAct_9fa48("228") ? true : stryMutAct_9fa48("227") ? data.itemCodigo : (stryCov_9fa48("227", "228", "229"), !data.itemCodigo)) {
      if (stryMutAct_9fa48("230")) {
        {}
      } else {
        stryCov_9fa48("230");
        return stryMutAct_9fa48("231") ? {} : (stryCov_9fa48("231"), {
          valid: stryMutAct_9fa48("232") ? true : (stryCov_9fa48("232"), false),
          error: stryMutAct_9fa48("233") ? "" : (stryCov_9fa48("233"), 'Código do item é obrigatório')
        });
      }
    }

    // 2. Valida tipo
    if (stryMutAct_9fa48("236") ? typeof data.itemCodigo === 'string' : stryMutAct_9fa48("235") ? false : stryMutAct_9fa48("234") ? true : (stryCov_9fa48("234", "235", "236"), typeof data.itemCodigo !== (stryMutAct_9fa48("237") ? "" : (stryCov_9fa48("237"), 'string')))) {
      if (stryMutAct_9fa48("238")) {
        {}
      } else {
        stryCov_9fa48("238");
        return stryMutAct_9fa48("239") ? {} : (stryCov_9fa48("239"), {
          valid: stryMutAct_9fa48("240") ? true : (stryCov_9fa48("240"), false),
          error: stryMutAct_9fa48("241") ? "" : (stryCov_9fa48("241"), 'Código do item deve ser uma string')
        });
      }
    }

    // 3. Sanitiza
    const sanitized = sanitizeItemCodigo(data.itemCodigo);

    // 4. Valida se não ficou vazio após sanitização
    if (stryMutAct_9fa48("244") ? sanitized.length !== 0 : stryMutAct_9fa48("243") ? false : stryMutAct_9fa48("242") ? true : (stryCov_9fa48("242", "243", "244"), sanitized.length === 0)) {
      if (stryMutAct_9fa48("245")) {
        {}
      } else {
        stryCov_9fa48("245");
        return stryMutAct_9fa48("246") ? {} : (stryCov_9fa48("246"), {
          valid: stryMutAct_9fa48("247") ? true : (stryCov_9fa48("247"), false),
          error: stryMutAct_9fa48("248") ? "" : (stryCov_9fa48("248"), 'Código do item inválido ou contém apenas caracteres não permitidos')
        });
      }
    }

    // 5. Valida tamanho máximo
    if (stryMutAct_9fa48("252") ? sanitized.length <= 16 : stryMutAct_9fa48("251") ? sanitized.length >= 16 : stryMutAct_9fa48("250") ? false : stryMutAct_9fa48("249") ? true : (stryCov_9fa48("249", "250", "251", "252"), sanitized.length > 16)) {
      if (stryMutAct_9fa48("253")) {
        {}
      } else {
        stryCov_9fa48("253");
        return stryMutAct_9fa48("254") ? {} : (stryCov_9fa48("254"), {
          valid: stryMutAct_9fa48("255") ? true : (stryCov_9fa48("255"), false),
          error: stryMutAct_9fa48("256") ? "" : (stryCov_9fa48("256"), 'Código do item não pode ter mais de 16 caracteres')
        });
      }
    }

    // 6. Valida tamanho mínimo
    if (stryMutAct_9fa48("260") ? sanitized.length >= 1 : stryMutAct_9fa48("259") ? sanitized.length <= 1 : stryMutAct_9fa48("258") ? false : stryMutAct_9fa48("257") ? true : (stryCov_9fa48("257", "258", "259", "260"), sanitized.length < 1)) {
      if (stryMutAct_9fa48("261")) {
        {}
      } else {
        stryCov_9fa48("261");
        return stryMutAct_9fa48("262") ? {} : (stryCov_9fa48("262"), {
          valid: stryMutAct_9fa48("263") ? true : (stryCov_9fa48("263"), false),
          error: stryMutAct_9fa48("264") ? "" : (stryCov_9fa48("264"), 'Código do item não pode estar vazio')
        });
      }
    }

    // 7. Valida formato (caracteres permitidos)
    if (stryMutAct_9fa48("267") ? false : stryMutAct_9fa48("266") ? true : stryMutAct_9fa48("265") ? isValidItemCodigoFormat(sanitized) : (stryCov_9fa48("265", "266", "267"), !isValidItemCodigoFormat(sanitized))) {
      if (stryMutAct_9fa48("268")) {
        {}
      } else {
        stryCov_9fa48("268");
        return stryMutAct_9fa48("269") ? {} : (stryCov_9fa48("269"), {
          valid: stryMutAct_9fa48("270") ? true : (stryCov_9fa48("270"), false),
          error: stryMutAct_9fa48("271") ? "" : (stryCov_9fa48("271"), 'Código do item contém caracteres inválidos. Use apenas letras, números e caracteres básicos')
        });
      }
    }

    // 8. Validações adicionais de segurança

    // Bloqueia tentativas óbvias de SQL injection
    const sqlKeywords = stryMutAct_9fa48("272") ? [] : (stryCov_9fa48("272"), [stryMutAct_9fa48("273") ? "" : (stryCov_9fa48("273"), 'SELECT'), stryMutAct_9fa48("274") ? "" : (stryCov_9fa48("274"), 'INSERT'), stryMutAct_9fa48("275") ? "" : (stryCov_9fa48("275"), 'UPDATE'), stryMutAct_9fa48("276") ? "" : (stryCov_9fa48("276"), 'DELETE'), stryMutAct_9fa48("277") ? "" : (stryCov_9fa48("277"), 'DROP'), stryMutAct_9fa48("278") ? "" : (stryCov_9fa48("278"), 'CREATE'), stryMutAct_9fa48("279") ? "" : (stryCov_9fa48("279"), 'ALTER'), stryMutAct_9fa48("280") ? "" : (stryCov_9fa48("280"), 'EXEC'), stryMutAct_9fa48("281") ? "" : (stryCov_9fa48("281"), 'UNION')]);
    const upperSanitized = stryMutAct_9fa48("282") ? sanitized.toLowerCase() : (stryCov_9fa48("282"), sanitized.toUpperCase());
    for (const keyword of sqlKeywords) {
      if (stryMutAct_9fa48("283")) {
        {}
      } else {
        stryCov_9fa48("283");
        if (stryMutAct_9fa48("285") ? false : stryMutAct_9fa48("284") ? true : (stryCov_9fa48("284", "285"), upperSanitized.includes(keyword))) {
          if (stryMutAct_9fa48("286")) {
            {}
          } else {
            stryCov_9fa48("286");
            return stryMutAct_9fa48("287") ? {} : (stryCov_9fa48("287"), {
              valid: stryMutAct_9fa48("288") ? true : (stryCov_9fa48("288"), false),
              error: stryMutAct_9fa48("289") ? "" : (stryCov_9fa48("289"), 'Código do item contém padrões não permitidos')
            });
          }
        }
      }
    }

    // Bloqueia tentativas de command injection
    const dangerousPatterns = stryMutAct_9fa48("290") ? [] : (stryCov_9fa48("290"), [stryMutAct_9fa48("291") ? "" : (stryCov_9fa48("291"), '&&'), stryMutAct_9fa48("292") ? "" : (stryCov_9fa48("292"), '||'), stryMutAct_9fa48("293") ? "" : (stryCov_9fa48("293"), '|'), stryMutAct_9fa48("294") ? "" : (stryCov_9fa48("294"), '`'), stryMutAct_9fa48("295") ? "" : (stryCov_9fa48("295"), '$'), stryMutAct_9fa48("296") ? "" : (stryCov_9fa48("296"), '$('), stryMutAct_9fa48("297") ? "" : (stryCov_9fa48("297"), '${')]);
    for (const pattern of dangerousPatterns) {
      if (stryMutAct_9fa48("298")) {
        {}
      } else {
        stryCov_9fa48("298");
        if (stryMutAct_9fa48("300") ? false : stryMutAct_9fa48("299") ? true : (stryCov_9fa48("299", "300"), sanitized.includes(pattern))) {
          if (stryMutAct_9fa48("301")) {
            {}
          } else {
            stryCov_9fa48("301");
            return stryMutAct_9fa48("302") ? {} : (stryCov_9fa48("302"), {
              valid: stryMutAct_9fa48("303") ? true : (stryCov_9fa48("303"), false),
              error: stryMutAct_9fa48("304") ? "" : (stryCov_9fa48("304"), 'Código do item contém caracteres não permitidos')
            });
          }
        }
      }
    }

    // Tudo válido
    return stryMutAct_9fa48("305") ? {} : (stryCov_9fa48("305"), {
      valid: stryMutAct_9fa48("306") ? false : (stryCov_9fa48("306"), true),
      data: stryMutAct_9fa48("307") ? {} : (stryCov_9fa48("307"), {
        itemCodigo: sanitized
      })
    });
  }
}