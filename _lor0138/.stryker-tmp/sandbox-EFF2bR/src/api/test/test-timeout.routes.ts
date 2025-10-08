// @ts-nocheck
// src/api/test/test-timeout.routes.ts
// ⚠️ APENAS PARA DESENVOLVIMENTO - REMOVA EM PRODUÇÃO
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
import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager'; // ✅ CORRIGIDO: path relativo

const router = Router();

/**
 * Rota de teste que simula lentidão
 * 
 * Uso:
 * GET /api/test/timeout?delay=35000
 * 
 * Query params:
 * - delay: tempo em ms (padrão: 35000 = 35 segundos)
 */
router.get(stryMutAct_9fa48("323") ? "" : (stryCov_9fa48("323"), '/timeout'), async (req: Request, res: Response) => {
  if (stryMutAct_9fa48("324")) {
    {}
  } else {
    stryCov_9fa48("324");
    const delay = stryMutAct_9fa48("327") ? parseInt(req.query.delay as string) && 35000 : stryMutAct_9fa48("326") ? false : stryMutAct_9fa48("325") ? true : (stryCov_9fa48("325", "326", "327"), parseInt(req.query.delay as string) || 35000);
    console.log(stryMutAct_9fa48("328") ? `` : (stryCov_9fa48("328"), `[TEST] Iniciando timeout test - aguardando ${delay}ms`));
    try {
      if (stryMutAct_9fa48("329")) {
        {}
      } else {
        stryCov_9fa48("329");
        // Simula operação lenta
        await new Promise(stryMutAct_9fa48("330") ? () => undefined : (stryCov_9fa48("330"), resolve => setTimeout(resolve, delay)));

        // Verifica se já houve timeout antes de enviar resposta
        if (stryMutAct_9fa48("332") ? false : stryMutAct_9fa48("331") ? true : (stryCov_9fa48("331", "332"), req.timedout)) {
          if (stryMutAct_9fa48("333")) {
            {}
          } else {
            stryCov_9fa48("333");
            console.log(stryMutAct_9fa48("334") ? "" : (stryCov_9fa48("334"), '[TEST] Timeout detectado - não enviando resposta'));
            return;
          }
        }

        // Se chegou aqui, não houve timeout
        res.json(stryMutAct_9fa48("335") ? {} : (stryCov_9fa48("335"), {
          success: stryMutAct_9fa48("336") ? false : (stryCov_9fa48("336"), true),
          message: stryMutAct_9fa48("337") ? `` : (stryCov_9fa48("337"), `Requisição completou após ${delay}ms`),
          warning: stryMutAct_9fa48("338") ? "" : (stryCov_9fa48("338"), 'Se você está vendo isso, o timeout NÃO funcionou!')
        }));
      }
    } catch (error) {
      if (stryMutAct_9fa48("339")) {
        {}
      } else {
        stryCov_9fa48("339");
        // Se já deu timeout, não tenta enviar resposta
        if (stryMutAct_9fa48("341") ? false : stryMutAct_9fa48("340") ? true : (stryCov_9fa48("340", "341"), req.timedout)) {
          if (stryMutAct_9fa48("342")) {
            {}
          } else {
            stryCov_9fa48("342");
            console.log(stryMutAct_9fa48("343") ? "" : (stryCov_9fa48("343"), '[TEST] Timeout detectado no catch - não enviando resposta'));
            return;
          }
        }
        console.error(stryMutAct_9fa48("344") ? "" : (stryCov_9fa48("344"), '[TEST] Erro no timeout test:'), error);
        res.status(500).json(stryMutAct_9fa48("345") ? {} : (stryCov_9fa48("345"), {
          success: stryMutAct_9fa48("346") ? true : (stryCov_9fa48("346"), false),
          error: stryMutAct_9fa48("347") ? "" : (stryCov_9fa48("347"), 'Erro no teste')
        }));
      }
    }
  }
});

/**
 * Rota que testa timeout do banco de dados
 * Usa WAITFOR DELAY do SQL Server
 */
router.get(stryMutAct_9fa48("348") ? "" : (stryCov_9fa48("348"), '/db-timeout'), async (req: Request, res: Response) => {
  if (stryMutAct_9fa48("349")) {
    {}
  } else {
    stryCov_9fa48("349");
    const delay = stryMutAct_9fa48("352") ? parseInt(req.query.delay as string) && 40 : stryMutAct_9fa48("351") ? false : stryMutAct_9fa48("350") ? true : (stryCov_9fa48("350", "351", "352"), parseInt(req.query.delay as string) || 40); // 40 segundos

    console.log(stryMutAct_9fa48("353") ? `` : (stryCov_9fa48("353"), `[TEST] Testando timeout de query - aguardando ${delay}s`));
    try {
      if (stryMutAct_9fa48("354")) {
        {}
      } else {
        stryCov_9fa48("354");
        // Query que espera X segundos (SQL Server)
        const query = stryMutAct_9fa48("355") ? `` : (stryCov_9fa48("355"), `
      BEGIN
        WAITFOR DELAY '00:00:${delay.toString().padStart(2, stryMutAct_9fa48("356") ? "" : (stryCov_9fa48("356"), '0'))}';
        SELECT 1 as result;
      END
    `);
        await DatabaseManager.queryEmp(query);

        // Se chegou aqui, não houve timeout
        res.json(stryMutAct_9fa48("357") ? {} : (stryCov_9fa48("357"), {
          success: stryMutAct_9fa48("358") ? false : (stryCov_9fa48("358"), true),
          message: stryMutAct_9fa48("359") ? `` : (stryCov_9fa48("359"), `Query completou após ${delay}s`),
          warning: stryMutAct_9fa48("360") ? "" : (stryCov_9fa48("360"), 'Se você está vendo isso, o timeout de query NÃO funcionou!')
        }));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("361")) {
        {}
      } else {
        stryCov_9fa48("361");
        // Esperamos que dê timeout
        console.log(stryMutAct_9fa48("362") ? "" : (stryCov_9fa48("362"), '[TEST] Timeout de query funcionou:'), error.message);
        res.status(408).json(stryMutAct_9fa48("363") ? {} : (stryCov_9fa48("363"), {
          success: stryMutAct_9fa48("364") ? true : (stryCov_9fa48("364"), false),
          error: stryMutAct_9fa48("365") ? "" : (stryCov_9fa48("365"), 'Query timeout (esperado)'),
          message: error.message
        }));
      }
    }
  }
});

/**
 * Rota que retorna rápido (para comparação)
 */
router.get(stryMutAct_9fa48("366") ? "" : (stryCov_9fa48("366"), '/fast'), (_req: Request, res: Response) => {
  if (stryMutAct_9fa48("367")) {
    {}
  } else {
    stryCov_9fa48("367");
    res.json(stryMutAct_9fa48("368") ? {} : (stryCov_9fa48("368"), {
      success: stryMutAct_9fa48("369") ? false : (stryCov_9fa48("369"), true),
      message: stryMutAct_9fa48("370") ? "" : (stryCov_9fa48("370"), 'Resposta rápida - sem timeout'),
      timestamp: new Date().toISOString()
    }));
  }
});
export default router;