// @ts-nocheck
// src/shared/utils/logger.ts
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
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
const logDir = stryMutAct_9fa48("4137") ? "" : (stryCov_9fa48("4137"), 'logs');

// Cria diretório de logs se não existir
if (stryMutAct_9fa48("4140") ? false : stryMutAct_9fa48("4139") ? true : stryMutAct_9fa48("4138") ? fs.existsSync(logDir) : (stryCov_9fa48("4138", "4139", "4140"), !fs.existsSync(logDir))) {
  if (stryMutAct_9fa48("4141")) {
    {}
  } else {
    stryCov_9fa48("4141");
    fs.mkdirSync(logDir, stryMutAct_9fa48("4142") ? {} : (stryCov_9fa48("4142"), {
      recursive: stryMutAct_9fa48("4143") ? false : (stryCov_9fa48("4143"), true)
    }));
  }
}

// Formatos customizados
const logFormat = winston.format.combine(winston.format.timestamp(stryMutAct_9fa48("4144") ? {} : (stryCov_9fa48("4144"), {
  format: stryMutAct_9fa48("4145") ? "" : (stryCov_9fa48("4145"), 'YYYY-MM-DD HH:mm:ss')
})), winston.format.errors(stryMutAct_9fa48("4146") ? {} : (stryCov_9fa48("4146"), {
  stack: stryMutAct_9fa48("4147") ? false : (stryCov_9fa48("4147"), true)
})), winston.format.splat(), winston.format.json());

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp(stryMutAct_9fa48("4148") ? {} : (stryCov_9fa48("4148"), {
  format: stryMutAct_9fa48("4149") ? "" : (stryCov_9fa48("4149"), 'HH:mm:ss')
})), winston.format.printf(({
  timestamp,
  level,
  message,
  ...meta
}) => {
  if (stryMutAct_9fa48("4150")) {
    {}
  } else {
    stryCov_9fa48("4150");
    let msg = stryMutAct_9fa48("4151") ? `` : (stryCov_9fa48("4151"), `${timestamp} [${level}] ${message}`);
    if (stryMutAct_9fa48("4155") ? Object.keys(meta).length <= 0 : stryMutAct_9fa48("4154") ? Object.keys(meta).length >= 0 : stryMutAct_9fa48("4153") ? false : stryMutAct_9fa48("4152") ? true : (stryCov_9fa48("4152", "4153", "4154", "4155"), Object.keys(meta).length > 0)) {
      if (stryMutAct_9fa48("4156")) {
        {}
      } else {
        stryCov_9fa48("4156");
        msg += stryMutAct_9fa48("4157") ? `` : (stryCov_9fa48("4157"), ` ${JSON.stringify(meta)}`);
      }
    }
    return msg;
  }
}));

// Transportes (onde os logs vão)
const transports: winston.transport[] = stryMutAct_9fa48("4158") ? [] : (stryCov_9fa48("4158"), [
// Console (sempre ativo)
new winston.transports.Console(stryMutAct_9fa48("4159") ? {} : (stryCov_9fa48("4159"), {
  format: consoleFormat,
  level: stryMutAct_9fa48("4162") ? process.env.LOG_LEVEL && 'info' : stryMutAct_9fa48("4161") ? false : stryMutAct_9fa48("4160") ? true : (stryCov_9fa48("4160", "4161", "4162"), process.env.LOG_LEVEL || (stryMutAct_9fa48("4163") ? "" : (stryCov_9fa48("4163"), 'info')))
}))]);

// ✅ MUDANÇA: Logs em arquivo também em desenvolvimento
if (stryMutAct_9fa48("4166") ? process.env.NODE_ENV === 'test' : stryMutAct_9fa48("4165") ? false : stryMutAct_9fa48("4164") ? true : (stryCov_9fa48("4164", "4165", "4166"), process.env.NODE_ENV !== (stryMutAct_9fa48("4167") ? "" : (stryCov_9fa48("4167"), 'test')))) {
  if (stryMutAct_9fa48("4168")) {
    {}
  } else {
    stryCov_9fa48("4168");
    // Logs de erro em arquivo separado
    transports.push(new DailyRotateFile(stryMutAct_9fa48("4169") ? {} : (stryCov_9fa48("4169"), {
      filename: path.join(logDir, stryMutAct_9fa48("4170") ? "" : (stryCov_9fa48("4170"), 'error-%DATE%.log')),
      datePattern: stryMutAct_9fa48("4171") ? "" : (stryCov_9fa48("4171"), 'YYYY-MM-DD'),
      level: stryMutAct_9fa48("4172") ? "" : (stryCov_9fa48("4172"), 'error'),
      maxSize: stryMutAct_9fa48("4173") ? "" : (stryCov_9fa48("4173"), '20m'),
      maxFiles: stryMutAct_9fa48("4174") ? "" : (stryCov_9fa48("4174"), '30d'),
      format: logFormat
    })));

    // Todos os logs combinados
    transports.push(new DailyRotateFile(stryMutAct_9fa48("4175") ? {} : (stryCov_9fa48("4175"), {
      filename: path.join(logDir, stryMutAct_9fa48("4176") ? "" : (stryCov_9fa48("4176"), 'app-%DATE%.log')),
      datePattern: stryMutAct_9fa48("4177") ? "" : (stryCov_9fa48("4177"), 'YYYY-MM-DD'),
      maxSize: stryMutAct_9fa48("4178") ? "" : (stryCov_9fa48("4178"), '20m'),
      maxFiles: stryMutAct_9fa48("4179") ? "" : (stryCov_9fa48("4179"), '14d'),
      format: logFormat
    })));
  }
}

// Cria o logger
const logger = winston.createLogger(stryMutAct_9fa48("4180") ? {} : (stryCov_9fa48("4180"), {
  level: stryMutAct_9fa48("4183") ? process.env.LOG_LEVEL && 'info' : stryMutAct_9fa48("4182") ? false : stryMutAct_9fa48("4181") ? true : (stryCov_9fa48("4181", "4182", "4183"), process.env.LOG_LEVEL || (stryMutAct_9fa48("4184") ? "" : (stryCov_9fa48("4184"), 'info'))),
  format: logFormat,
  transports,
  exitOnError: stryMutAct_9fa48("4185") ? true : (stryCov_9fa48("4185"), false)
}));

// Helper para adicionar contexto às mensagens
export interface LogContext {
  requestId?: string;
  userId?: string;
  itemCodigo?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

// Funções auxiliares tipadas
export const log = stryMutAct_9fa48("4186") ? {} : (stryCov_9fa48("4186"), {
  error: (message: string, context?: LogContext) => {
    if (stryMutAct_9fa48("4187")) {
      {}
    } else {
      stryCov_9fa48("4187");
      logger.error(message, context);
    }
  },
  warn: (message: string, context?: LogContext) => {
    if (stryMutAct_9fa48("4188")) {
      {}
    } else {
      stryCov_9fa48("4188");
      logger.warn(message, context);
    }
  },
  info: (message: string, context?: LogContext) => {
    if (stryMutAct_9fa48("4189")) {
      {}
    } else {
      stryCov_9fa48("4189");
      logger.info(message, context);
    }
  },
  http: (message: string, context?: LogContext) => {
    if (stryMutAct_9fa48("4190")) {
      {}
    } else {
      stryCov_9fa48("4190");
      logger.http(message, context);
    }
  },
  debug: (message: string, context?: LogContext) => {
    if (stryMutAct_9fa48("4191")) {
      {}
    } else {
      stryCov_9fa48("4191");
      logger.debug(message, context);
    }
  }
});
export default logger;