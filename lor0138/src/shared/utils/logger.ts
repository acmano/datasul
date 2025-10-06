// src/shared/utils/logger.ts

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

/**
 * =============================================================================
 * SISTEMA DE LOGGING - WINSTON
 * =============================================================================
 *
 * Sistema centralizado de logging utilizando Winston com suporte a:
 * - Múltiplos transportes (console + arquivos)
 * - Rotação diária automática de logs
 * - Formatação customizada por ambiente
 * - Níveis de log hierárquicos
 * - Contexto estruturado (JSON)
 *
 * @module Logger
 * @category Utils
 * @subcategory Logging
 *
 * NÍVEIS DE LOG (do mais grave ao menos grave):
 * - error: Erros críticos que requerem atenção imediata
 * - warn: Avisos de situações potencialmente problemáticas
 * - info: Informações gerais sobre operação do sistema
 * - http: Logs de requisições HTTP (entrada/saída)
 * - debug: Informações detalhadas para troubleshooting
 *
 * TRANSPORTES CONFIGURADOS:
 * - Console: Sempre ativo, formato colorido e legível
 * - error-YYYY-MM-DD.log: Apenas erros (level: error)
 * - app-YYYY-MM-DD.log: Todos os logs (combinados)
 *
 * AMBIENTES:
 * - test: Apenas console (logs mockados em testes)
 * - development: Console + arquivos
 * - production: Console + arquivos
 *
 * ROTAÇÃO DE ARQUIVOS:
 * - Rotação diária automática (novos arquivos por dia)
 * - Erro: Retém 30 dias, tamanho máximo 20MB por arquivo
 * - App: Retém 14 dias, tamanho máximo 20MB por arquivo
 *
 * ESTRUTURA DOS LOGS:
 * - timestamp: Data/hora do evento
 * - level: Nível do log (error, warn, info, etc)
 * - message: Mensagem principal
 * - context: Objeto com dados adicionais (opcional)
 *
 * PONTOS CRÍTICOS:
 * - Logs em JSON facilitam parsing por ferramentas (ELK, Splunk, etc)
 * - Diretório logs/ é criado automaticamente se não existir
 * - exitOnError: false - Logger não para processo em caso de erro
 * - DailyRotateFile gerencia rotação e limpeza automaticamente
 *
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO: Diretório de Logs
// ---------------------------------------------------------------------------
const logDir = 'logs';

// Cria diretório de logs se não existir
// Usa recursive: true para criar diretórios pais se necessário
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// FORMATO: JSON para Arquivos
// ---------------------------------------------------------------------------
/**
 * Formato para logs gravados em arquivos.
 *
 * @description
 * Logs em formato JSON estruturado facilitam:
 * - Parsing por ferramentas de análise (ELK Stack, Splunk, Datadog)
 * - Busca e filtragem eficiente
 * - Integração com sistemas de monitoramento
 * - Queries estruturadas (ex: "statusCode >= 500")
 *
 * CAMPOS INCLUÍDOS:
 * - timestamp: ISO 8601 com milissegundos
 * - level: Nível do log (string)
 * - message: Mensagem principal (string)
 * - stack: Stack trace (apenas em erros)
 * - ...context: Campos adicionais do contexto
 *
 * EXEMPLO DE LOG JSON:
 * {
 *   "timestamp": "2025-10-06 14:30:45",
 *   "level": "error",
 *   "message": "Erro ao buscar item",
 *   "itemCodigo": "7530110",
 *   "error": "Connection timeout",
 *   "stack": "Error: Connection timeout\n    at ..."
 * }
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),  // Inclui stack trace em erros
  winston.format.splat(),                  // Suporta string interpolation
  winston.format.json()                    // Converte para JSON
);

// ---------------------------------------------------------------------------
// FORMATO: Console Legível
// ---------------------------------------------------------------------------
/**
 * Formato para logs exibidos no console.
 *
 * @description
 * Formato otimizado para leitura humana durante desenvolvimento.
 * Utiliza cores para diferenciar níveis de log visualmente.
 *
 * CORES POR NÍVEL (via winston.format.colorize):
 * - error: Vermelho
 * - warn: Amarelo
 * - info: Verde
 * - http: Cyan
 * - debug: Azul
 *
 * FORMATO DE SAÍDA:
 * HH:mm:ss [level] message {context}
 *
 * EXEMPLO:
 * 14:30:45 [error] Erro ao buscar item {"itemCodigo":"7530110"}
 * 14:30:46 [info] Item encontrado {"itemCodigo":"7530110","duration":123}
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),                         // Adiciona cores ANSI
  winston.format.timestamp({ format: 'HH:mm:ss' }), // Apenas hora (sem data)
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Monta mensagem base
    let msg = `${timestamp} [${level}] ${message}`;

    // Adiciona contexto se houver
    // Remove campos internos do winston (level, message, timestamp, splat)
    const contextKeys = Object.keys(meta).filter(
      key => !['level', 'message', 'timestamp', 'splat'].includes(key)
    );

    if (contextKeys.length > 0) {
      const context = contextKeys.reduce((obj, key) => {
        obj[key] = meta[key];
        return obj;
      }, {} as Record<string, any>);

      msg += ` ${JSON.stringify(context)}`;
    }

    return msg;
  })
);

// ---------------------------------------------------------------------------
// TRANSPORTES: Onde os Logs São Gravados
// ---------------------------------------------------------------------------
/**
 * Array de transportes (destinos) para os logs.
 *
 * @description
 * Winston suporta múltiplos transportes simultâneos.
 * Cada transporte pode ter nível e formato diferentes.
 *
 * TRANSPORTES CONFIGURADOS:
 * 1. Console: Sempre ativo (exceto em testes)
 * 2. DailyRotateFile (error): Apenas erros críticos
 * 3. DailyRotateFile (app): Todos os níveis de log
 *
 * ROTAÇÃO AUTOMÁTICA:
 * - Novos arquivos criados à meia-noite (00:00)
 * - Arquivos antigos deletados após período de retenção
 * - Compressão automática de arquivos antigos (gzip)
 */
const transports: winston.transport[] = [
  // ---------------------------------------------------------------------------
  // TRANSPORTE 1: Console
  // ---------------------------------------------------------------------------
  /**
   * Console transport - exibe logs no terminal.
   *
   * QUANDO É USADO:
   * - Sempre durante desenvolvimento (npm run dev)
   * - Sempre durante produção (para stdout/stderr)
   * - NUNCA durante testes (evita poluir output dos testes)
   *
   * CONFIGURAÇÃO:
   * - format: consoleFormat (colorido e legível)
   * - level: Controlado por LOG_LEVEL (env) ou 'info' (padrão)
   */
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info',
  }),
];

// ---------------------------------------------------------------------------
// TRANSPORTES DE ARQUIVO (Não em testes)
// ---------------------------------------------------------------------------
/**
 * Adiciona transportes de arquivo se não estiver em ambiente de teste.
 *
 * RAZÃO:
 * Em testes, logs em arquivo não são necessários e podem:
 * - Diminuir performance dos testes
 * - Criar arquivos desnecessários
 * - Complicar cleanup após testes
 */
if (process.env.NODE_ENV !== 'test') {

  // ---------------------------------------------------------------------------
  // TRANSPORTE 2: Arquivo de Erros
  // ---------------------------------------------------------------------------
  /**
   * DailyRotateFile para logs de erro.
   *
   * PROPÓSITO:
   * Arquivo separado apenas para erros facilita:
   * - Monitoramento de problemas críticos
   * - Alertas baseados em erros
   * - Análise de falhas sem ruído de outros logs
   *
   * CONFIGURAÇÃO:
   * - filename: error-YYYY-MM-DD.log
   * - level: error (apenas erros críticos)
   * - maxSize: 20MB (rotação ao atingir tamanho)
   * - maxFiles: 30 dias (deleta arquivos mais antigos)
   * - format: logFormat (JSON estruturado)
   *
   * EXEMPLO DE ARQUIVO:
   * logs/error-2025-10-06.log
   * logs/error-2025-10-05.log
   * ...
   */
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    })
  );

  // ---------------------------------------------------------------------------
  // TRANSPORTE 3: Arquivo de Logs Combinados
  // ---------------------------------------------------------------------------
  /**
   * DailyRotateFile para todos os logs.
   *
   * PROPÓSITO:
   * Arquivo completo com todos os níveis de log para:
   * - Análise histórica completa
   * - Debugging de problemas complexos
   * - Auditoria de operações
   * - Rastreamento de requisições
   *
   * CONFIGURAÇÃO:
   * - filename: app-YYYY-MM-DD.log
   * - level: (herda do logger - todos os níveis)
   * - maxSize: 20MB (rotação ao atingir tamanho)
   * - maxFiles: 14 dias (retenção menor que errors)
   * - format: logFormat (JSON estruturado)
   *
   * EXEMPLO DE ARQUIVO:
   * logs/app-2025-10-06.log
   * logs/app-2025-10-05.log
   * ...
   */
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    })
  );
}

// ---------------------------------------------------------------------------
// CRIAÇÃO DO LOGGER
// ---------------------------------------------------------------------------
/**
 * Instância principal do logger Winston.
 *
 * CONFIGURAÇÃO:
 * - level: Nível mínimo de log (env ou 'info')
 * - format: Formato base (JSON para arquivos)
 * - transports: Array de destinos dos logs
 * - exitOnError: false (não mata processo em erro de logging)
 *
 * NÍVEL DE LOG:
 * Controlado por variável de ambiente LOG_LEVEL:
 * - LOG_LEVEL=error: Apenas erros
 * - LOG_LEVEL=warn: Erros + avisos
 * - LOG_LEVEL=info: Erros + avisos + info (padrão)
 * - LOG_LEVEL=http: + logs HTTP
 * - LOG_LEVEL=debug: Tudo (modo debug)
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false, // Logger não para processo se falhar
});

// ---------------------------------------------------------------------------
// INTERFACE: LogContext
// ---------------------------------------------------------------------------
/**
 * Interface para contexto estruturado dos logs.
 *
 * @interface LogContext
 *
 * @description
 * Define campos opcionais que podem ser incluídos em qualquer log
 * para adicionar contexto e facilitar filtragem/análise.
 *
 * CAMPOS COMUNS:
 * - correlationId: UUID para rastrear requisição entre serviços
 * - userId: Identificador do usuário (se autenticado)
 * - itemCodigo: Código do item sendo processado
 * - ip: Endereço IP do cliente
 * - method: Método HTTP (GET, POST, etc)
 * - url: URL da requisição
 * - statusCode: Código de status HTTP
 * - duration: Duração da operação em ms
 *
 * EXTENSÍVEL:
 * Interface usa index signature [key: string]: any
 * Permite adicionar qualquer campo adicional dinamicamente
 *
 * @example
 * // Contexto mínimo
 * log.info('Operação concluída');
 *
 * @example
 * // Contexto com correlation ID
 * log.info('Item processado', {
 *   correlationId: 'abc-123',
 *   itemCodigo: '7530110',
 *   duration: 250
 * });
 *
 * @example
 * // Contexto HTTP completo
 * log.http('Requisição finalizada', {
 *   correlationId: req.id,
 *   method: 'GET',
 *   url: '/api/items/7530110',
 *   statusCode: 200,
 *   duration: 123,
 *   ip: '192.168.1.100'
 * });
 */
export interface LogContext {
  correlationId?: string;
  userId?: string;
  itemCodigo?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any; // Permite campos adicionais
}

// ---------------------------------------------------------------------------
// API PÚBLICA: Funções Helper Tipadas
// ---------------------------------------------------------------------------
/**
 * API pública do logger com funções tipadas para cada nível.
 *
 * @description
 * Objeto exportado com métodos tipados que encapsulam o logger Winston.
 * Facilita uso e garante type safety com TypeScript.
 *
 * BENEFÍCIOS:
 * - Autocomplete no IDE (IntelliSense)
 * - Type checking em contexto
 * - API consistente e limpa
 * - Fácil de mockar em testes
 *
 * MÉTODOS DISPONÍVEIS:
 * - log.error(message, context?): Erros críticos
 * - log.warn(message, context?): Avisos
 * - log.info(message, context?): Informações gerais
 * - log.http(message, context?): Requisições HTTP
 * - log.debug(message, context?): Debug detalhado
 *
 * @namespace log
 * @public
 * @example
 * // Import do logger
 * import { log } from '@shared/utils/logger';
 *
 * // Uso simples
 * log.info('Servidor iniciado');
 *
 * // Com contexto
 * log.error('Falha na conexão', {
 *   error: error.message,
 *   host: 'database.server.com',
 *   port: 1433
 * });
 *
 * // Em middleware
 * log.http('Requisição recebida', {
 *   correlationId: req.id,
 *   method: req.method,
 *   url: req.url
 * });
 */
export const log = {
  /**
   * ---------------------------------------------------------------------------
   * ERROR: Erros Críticos
   * ---------------------------------------------------------------------------
   *
   * Registra erros críticos que requerem atenção imediata.
   *
   * @description
   * Use para erros que:
   * - Impedem operação normal do sistema
   * - Requerem intervenção humana
   * - Podem causar perda de dados
   * - Afetam múltiplos usuários
   *
   * EXEMPLOS DE USO:
   * - Falha na conexão com banco de dados
   * - Exceções não tratadas
   * - Timeout crítico
   * - Erro de configuração fatal
   *
   * @param {string} message - Mensagem descritiva do erro
   * @param {LogContext} context - Contexto adicional (opcional)
   *
   * @example
   * log.error('Falha na conexão com banco', {
   *   error: error.message,
   *   host: 'sql.server.com',
   *   correlationId: req.id
   * });
   */
  error: (message: string, context?: LogContext) => {
    logger.error(message, context);
  },

  /**
   * ---------------------------------------------------------------------------
   * WARN: Avisos
   * ---------------------------------------------------------------------------
   *
   * Registra avisos de situações anormais mas não críticas.
   *
   * @description
   * Use para situações que:
   * - Não impedem operação imediata
   * - Podem levar a problemas futuros
   * - Indicam uso incorreto da API
   * - Sugerem necessidade de manutenção
   *
   * EXEMPLOS DE USO:
   * - Item não encontrado (404)
   * - Parâmetro deprecated sendo usado
   * - Cache miss frequente
   * - Timeout não crítico
   *
   * @param {string} message - Mensagem do aviso
   * @param {LogContext} context - Contexto adicional (opcional)
   *
   * @example
   * log.warn('Item não encontrado', {
   *   itemCodigo: '7530110',
   *   correlationId: req.id
   * });
   */
  warn: (message: string, context?: LogContext) => {
    logger.warn(message, context);
  },

  /**
   * ---------------------------------------------------------------------------
   * INFO: Informações Gerais
   * ---------------------------------------------------------------------------
   *
   * Registra informações sobre operação normal do sistema.
   *
   * @description
   * Use para eventos que:
   * - Indicam progresso normal
   * - Marcam marcos importantes
   * - Documentam decisões do sistema
   * - Auxiliam auditoria
   *
   * EXEMPLOS DE USO:
   * - Servidor iniciado
   * - Conexão estabelecida
   * - Operação concluída com sucesso
   * - Configuração carregada
   *
   * @param {string} message - Mensagem informativa
   * @param {LogContext} context - Contexto adicional (opcional)
   *
   * @example
   * log.info('Servidor iniciado', {
   *   port: 3000,
   *   environment: 'production'
   * });
   */
  info: (message: string, context?: LogContext) => {
    logger.info(message, context);
  },

  /**
   * ---------------------------------------------------------------------------
   * HTTP: Requisições HTTP
   * ---------------------------------------------------------------------------
   *
   * Registra requisições HTTP (entrada e saída).
   *
   * @description
   * Use para todas as requisições HTTP:
   * - Requisição recebida
   * - Requisição finalizada
   * - Chamadas a APIs externas
   * - Webhooks recebidos
   *
   * EXEMPLOS DE USO:
   * - Logging de middleware
   * - Rastreamento de performance
   * - Auditoria de acessos
   * - Análise de tráfego
   *
   * @param {string} message - Mensagem sobre requisição
   * @param {LogContext} context - Contexto HTTP (method, url, etc)
   *
   * @example
   * log.http('Requisição finalizada', {
   *   correlationId: req.id,
   *   method: 'GET',
   *   url: '/api/items/7530110',
   *   statusCode: 200,
   *   duration: 123
   * });
   */
  http: (message: string, context?: LogContext) => {
    logger.http(message, context);
  },

  /**
   * ---------------------------------------------------------------------------
   * DEBUG: Informações Detalhadas
   * ---------------------------------------------------------------------------
   *
   * Registra informações detalhadas para troubleshooting.
   *
   * @description
   * Use para debugging quando:
   * - Investigar problemas complexos
   * - Rastrear fluxo de execução
   * - Inspecionar valores de variáveis
   * - Validar lógica de negócio
   *
   * IMPORTANTE:
   * - Apenas ativo quando LOG_LEVEL=debug
   * - Não use em produção (muito verboso)
   * - Pode impactar performance
   *
   * EXEMPLOS DE USO:
   * - Valores de parâmetros
   * - Estado de objetos
   * - Decisões condicionais
   * - Queries SQL executadas
   *
   * @param {string} message - Mensagem de debug
   * @param {LogContext} context - Contexto detalhado (opcional)
   *
   * @example
   * log.debug('Query executada', {
   *   sql: 'SELECT * FROM item WHERE...',
   *   params: ['7530110'],
   *   duration: 45
   * });
   */
  debug: (message: string, context?: LogContext) => {
    logger.debug(message, context);
  },
};

// ---------------------------------------------------------------------------
// EXPORT DEFAULT
// ---------------------------------------------------------------------------
/**
 * Exporta instância do logger Winston para casos especiais.
 *
 * @description
 * Use a instância direta do Winston quando precisar de:
 * - Métodos avançados do Winston
 * - Adição dinâmica de transportes
 * - Manipulação de exceções não capturadas
 * - Integração com frameworks específicos
 *
 * NA MAIORIA DOS CASOS: Use o objeto `log` ao invés desta exportação
 *
 * @example
 * // Caso especial: adicionar transporte dinamicamente
 * import logger from '@shared/utils/logger';
 * logger.add(new winston.transports.File({ filename: 'special.log' }));
 */
export default logger;