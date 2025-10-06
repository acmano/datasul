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
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    // Remove espaços em branco nas extremidades
    let sanitized = stryMutAct_9fa48("1") ? value : (stryCov_9fa48("1"), value.trim());

    // Remove caracteres de controle e não imprimíveis
    sanitized = sanitized.replace(stryMutAct_9fa48("2") ? /[^\x00-\x1F\x7F]/g : (stryCov_9fa48("2"), /[\x00-\x1F\x7F]/g), stryMutAct_9fa48("3") ? "Stryker was here!" : (stryCov_9fa48("3"), ''));

    // Remove tentativas de path traversal
    sanitized = sanitized.replace(/\.\./g, stryMutAct_9fa48("4") ? "Stryker was here!" : (stryCov_9fa48("4"), ''));
    sanitized = sanitized.replace(stryMutAct_9fa48("5") ? /[^\/\\]/g : (stryCov_9fa48("5"), /[\/\\]/g), stryMutAct_9fa48("6") ? "Stryker was here!" : (stryCov_9fa48("6"), ''));

    // Remove caracteres SQL perigosos adicionais (redundante com prepared statements, mas seguro)
    sanitized = sanitized.replace(stryMutAct_9fa48("7") ? /[^';"\-\-]/g : (stryCov_9fa48("7"), /[';"\-\-]/g), stryMutAct_9fa48("8") ? "Stryker was here!" : (stryCov_9fa48("8"), ''));

    // Remove tags HTML/XML (prevenção XSS)
    sanitized = sanitized.replace(stryMutAct_9fa48("10") ? /<[>]*>/g : stryMutAct_9fa48("9") ? /<[^>]>/g : (stryCov_9fa48("9", "10"), /<[^>]*>/g), stryMutAct_9fa48("11") ? "Stryker was here!" : (stryCov_9fa48("11"), ''));
    return sanitized;
  }
}

/**
 * Valida formato do código do item
 */
function isValidItemCodigoFormat(value: string): boolean {
  if (stryMutAct_9fa48("12")) {
    {}
  } else {
    stryCov_9fa48("12");
    // Permite apenas: letras e números
    // Caracteres permitidos: A-Z, a-z, 0-9
    const validPattern = stryMutAct_9fa48("16") ? /^[^A-Za-z0-9]+$/ : stryMutAct_9fa48("15") ? /^[A-Za-z0-9]$/ : stryMutAct_9fa48("14") ? /^[A-Za-z0-9]+/ : stryMutAct_9fa48("13") ? /[A-Za-z0-9]+$/ : (stryCov_9fa48("13", "14", "15", "16"), /^[A-Za-z0-9]+$/);
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
  if (stryMutAct_9fa48("17")) {
    {}
  } else {
    stryCov_9fa48("17");
    // 1. Verifica se itemCodigo foi fornecido
    if (stryMutAct_9fa48("20") ? false : stryMutAct_9fa48("19") ? true : stryMutAct_9fa48("18") ? data.itemCodigo : (stryCov_9fa48("18", "19", "20"), !data.itemCodigo)) {
      if (stryMutAct_9fa48("21")) {
        {}
      } else {
        stryCov_9fa48("21");
        return stryMutAct_9fa48("22") ? {} : (stryCov_9fa48("22"), {
          valid: stryMutAct_9fa48("23") ? true : (stryCov_9fa48("23"), false),
          error: stryMutAct_9fa48("24") ? "" : (stryCov_9fa48("24"), 'Código do item é obrigatório')
        });
      }
    }

    // 2. Valida tipo
    if (stryMutAct_9fa48("27") ? typeof data.itemCodigo === 'string' : stryMutAct_9fa48("26") ? false : stryMutAct_9fa48("25") ? true : (stryCov_9fa48("25", "26", "27"), typeof data.itemCodigo !== (stryMutAct_9fa48("28") ? "" : (stryCov_9fa48("28"), 'string')))) {
      if (stryMutAct_9fa48("29")) {
        {}
      } else {
        stryCov_9fa48("29");
        return stryMutAct_9fa48("30") ? {} : (stryCov_9fa48("30"), {
          valid: stryMutAct_9fa48("31") ? true : (stryCov_9fa48("31"), false),
          error: stryMutAct_9fa48("32") ? "" : (stryCov_9fa48("32"), 'Código do item deve ser uma string')
        });
      }
    }

    // 3. Sanitiza
    const sanitized = sanitizeItemCodigo(data.itemCodigo);

    // 4. Valida se não ficou vazio após sanitização
    if (stryMutAct_9fa48("35") ? sanitized.length !== 0 : stryMutAct_9fa48("34") ? false : stryMutAct_9fa48("33") ? true : (stryCov_9fa48("33", "34", "35"), sanitized.length === 0)) {
      if (stryMutAct_9fa48("36")) {
        {}
      } else {
        stryCov_9fa48("36");
        return stryMutAct_9fa48("37") ? {} : (stryCov_9fa48("37"), {
          valid: stryMutAct_9fa48("38") ? true : (stryCov_9fa48("38"), false),
          error: stryMutAct_9fa48("39") ? "" : (stryCov_9fa48("39"), 'Código do item inválido ou contém apenas caracteres não permitidos')
        });
      }
    }

    // 5. Valida tamanho máximo
    if (stryMutAct_9fa48("43") ? sanitized.length <= 16 : stryMutAct_9fa48("42") ? sanitized.length >= 16 : stryMutAct_9fa48("41") ? false : stryMutAct_9fa48("40") ? true : (stryCov_9fa48("40", "41", "42", "43"), sanitized.length > 16)) {
      if (stryMutAct_9fa48("44")) {
        {}
      } else {
        stryCov_9fa48("44");
        return stryMutAct_9fa48("45") ? {} : (stryCov_9fa48("45"), {
          valid: stryMutAct_9fa48("46") ? true : (stryCov_9fa48("46"), false),
          error: stryMutAct_9fa48("47") ? "" : (stryCov_9fa48("47"), 'Código do item não pode ter mais de 16 caracteres')
        });
      }
    }

    // 6. Valida tamanho mínimo
    if (stryMutAct_9fa48("51") ? sanitized.length >= 1 : stryMutAct_9fa48("50") ? sanitized.length <= 1 : stryMutAct_9fa48("49") ? false : stryMutAct_9fa48("48") ? true : (stryCov_9fa48("48", "49", "50", "51"), sanitized.length < 1)) {
      if (stryMutAct_9fa48("52")) {
        {}
      } else {
        stryCov_9fa48("52");
        return stryMutAct_9fa48("53") ? {} : (stryCov_9fa48("53"), {
          valid: stryMutAct_9fa48("54") ? true : (stryCov_9fa48("54"), false),
          error: stryMutAct_9fa48("55") ? "" : (stryCov_9fa48("55"), 'Código do item não pode estar vazio')
        });
      }
    }

    // 7. Valida formato (caracteres permitidos)
    if (stryMutAct_9fa48("58") ? false : stryMutAct_9fa48("57") ? true : stryMutAct_9fa48("56") ? isValidItemCodigoFormat(sanitized) : (stryCov_9fa48("56", "57", "58"), !isValidItemCodigoFormat(sanitized))) {
      if (stryMutAct_9fa48("59")) {
        {}
      } else {
        stryCov_9fa48("59");
        return stryMutAct_9fa48("60") ? {} : (stryCov_9fa48("60"), {
          valid: stryMutAct_9fa48("61") ? true : (stryCov_9fa48("61"), false),
          error: stryMutAct_9fa48("62") ? "" : (stryCov_9fa48("62"), 'Código do item contém caracteres inválidos. Use apenas letras, números e caracteres básicos')
        });
      }
    }

    // 8. Validações adicionais de segurança

    // Bloqueia tentativas óbvias de SQL injection
    const sqlKeywords = stryMutAct_9fa48("63") ? [] : (stryCov_9fa48("63"), [stryMutAct_9fa48("64") ? "" : (stryCov_9fa48("64"), 'SELECT'), stryMutAct_9fa48("65") ? "" : (stryCov_9fa48("65"), 'INSERT'), stryMutAct_9fa48("66") ? "" : (stryCov_9fa48("66"), 'UPDATE'), stryMutAct_9fa48("67") ? "" : (stryCov_9fa48("67"), 'DELETE'), stryMutAct_9fa48("68") ? "" : (stryCov_9fa48("68"), 'DROP'), stryMutAct_9fa48("69") ? "" : (stryCov_9fa48("69"), 'CREATE'), stryMutAct_9fa48("70") ? "" : (stryCov_9fa48("70"), 'ALTER'), stryMutAct_9fa48("71") ? "" : (stryCov_9fa48("71"), 'EXEC'), stryMutAct_9fa48("72") ? "" : (stryCov_9fa48("72"), 'UNION')]);
    const upperSanitized = stryMutAct_9fa48("73") ? sanitized.toLowerCase() : (stryCov_9fa48("73"), sanitized.toUpperCase());
    for (const keyword of sqlKeywords) {
      if (stryMutAct_9fa48("74")) {
        {}
      } else {
        stryCov_9fa48("74");
        if (stryMutAct_9fa48("76") ? false : stryMutAct_9fa48("75") ? true : (stryCov_9fa48("75", "76"), upperSanitized.includes(keyword))) {
          if (stryMutAct_9fa48("77")) {
            {}
          } else {
            stryCov_9fa48("77");
            return stryMutAct_9fa48("78") ? {} : (stryCov_9fa48("78"), {
              valid: stryMutAct_9fa48("79") ? true : (stryCov_9fa48("79"), false),
              error: stryMutAct_9fa48("80") ? "" : (stryCov_9fa48("80"), 'Código do item contém padrões não permitidos')
            });
          }
        }
      }
    }

    // Bloqueia tentativas de command injection
    const dangerousPatterns = stryMutAct_9fa48("81") ? [] : (stryCov_9fa48("81"), [stryMutAct_9fa48("82") ? "" : (stryCov_9fa48("82"), '&&'), stryMutAct_9fa48("83") ? "" : (stryCov_9fa48("83"), '||'), stryMutAct_9fa48("84") ? "" : (stryCov_9fa48("84"), '|'), stryMutAct_9fa48("85") ? "" : (stryCov_9fa48("85"), '`'), stryMutAct_9fa48("86") ? "" : (stryCov_9fa48("86"), '$'), stryMutAct_9fa48("87") ? "" : (stryCov_9fa48("87"), '$('), stryMutAct_9fa48("88") ? "" : (stryCov_9fa48("88"), '${')]);
    for (const pattern of dangerousPatterns) {
      if (stryMutAct_9fa48("89")) {
        {}
      } else {
        stryCov_9fa48("89");
        if (stryMutAct_9fa48("91") ? false : stryMutAct_9fa48("90") ? true : (stryCov_9fa48("90", "91"), sanitized.includes(pattern))) {
          if (stryMutAct_9fa48("92")) {
            {}
          } else {
            stryCov_9fa48("92");
            return stryMutAct_9fa48("93") ? {} : (stryCov_9fa48("93"), {
              valid: stryMutAct_9fa48("94") ? true : (stryCov_9fa48("94"), false),
              error: stryMutAct_9fa48("95") ? "" : (stryCov_9fa48("95"), 'Código do item contém caracteres não permitidos')
            });
          }
        }
      }
    }

    // Tudo válido
    return stryMutAct_9fa48("96") ? {} : (stryCov_9fa48("96"), {
      valid: stryMutAct_9fa48("97") ? false : (stryCov_9fa48("97"), true),
      data: stryMutAct_9fa48("98") ? {} : (stryCov_9fa48("98"), {
        itemCodigo: sanitized
      })
    });
  }
}