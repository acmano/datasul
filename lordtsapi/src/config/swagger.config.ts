// src/config/swagger.config.ts

import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerOptions } from 'swagger-ui-express';
import { appConfig } from './app.config';

/**
 * @fileoverview Configuração do Swagger/OpenAPI
 *
 * Define a documentação interativa da API usando Swagger UI e OpenAPI 3.0.
 * A documentação é gerada automaticamente a partir de:
 * - Anotações JSDoc nos arquivos (routes, controllers)
 * - Schemas definidos neste arquivo
 * - Configurações globais de servers e security
 *
 * **Acesso à Documentação:**
 * - Swagger UI: http://localhost:3000/api-docs
 * - OpenAPI JSON: http://localhost:3000/api-docs.json
 *
 * **Características:**
 * - OpenAPI 3.0.0 compliant
 * - Schemas reutilizáveis para Request/Response
 * - Exemplos práticos para cada endpoint
 * - Componentes compartilhados (Error, HealthCheck, etc)
 * - Tags para organização de endpoints
 *
 * **Estrutura:**
 * ```
 * Swagger Config
 * ├── Info (título, versão, descrição)
 * ├── Servers (dev, prod)
 * ├── Tags (agrupamento de endpoints)
 * ├── Components
 * │   ├── Schemas (modelos de dados)
 * │   ├── Responses (respostas reutilizáveis)
 * │   └── Parameters (parâmetros reutilizáveis)
 * └── APIs (arquivos a serem escaneados)
 * ```
 *
 * @module SwaggerConfig
 * @category Config
 */

// ============================================================================
// CONFIGURAÇÃO PRINCIPAL
// ============================================================================

/**
 * Opções de configuração do Swagger/OpenAPI
 *
 * Define toda a estrutura da documentação da API, incluindo
 * metadados, schemas, componentes reutilizáveis e caminhos
 * dos arquivos a serem escaneados para anotações.
 *
 * @constant
 */
const options: swaggerJsdoc.Options = {
  // ==========================================================================
  // DEFINIÇÃO DA API
  // ==========================================================================
  definition: {
    openapi: '3.0.0',

    // ========================================================================
    // INFORMAÇÕES GERAIS
    // ========================================================================
    info: {
      title: 'Datasul API - Documentação',
      version: '1.0.0',
      description: `
        API para centralização de consultas de dados do ERP Totvs Datasul.

        ## Características
        - Consulta de dados cadastrais de itens
        - Suporte a múltiplas bases de dados (SQL Server, ODBC)
        - Rate limiting e proteção contra ataques
        - Logs estruturados e rastreamento de requisições
        - Cache inteligente para otimização de performance

        ## Autenticação
        A API suporta autenticação opcional por API Key.
        - Com API Key: Rate limiting baseado no tier do usuário
        - Sem API Key: Rate limiting padrão por IP

        ## Rate Limiting
        | Tier | Por Minuto | Por Hora | Por Dia |
        |------|------------|----------|---------|
        | Free | 10 | 100 | 1,000 |
        | Premium | 60 | 1,000 | 10,000 |
        | Enterprise | 300 | 10,000 | 100,000 |
        | Admin | 1,000 | 50,000 | 1,000,000 |

        ## Correlation ID
        Todas as requisições suportam header X-Correlation-ID para rastreamento.
        Se não fornecido, o servidor gera automaticamente.

        ## Cache
        Respostas são cacheadas por 10 minutos (TTL configurável).
        Header X-Cache indica HIT ou MISS.
      `,
      contact: {
        name: 'Equipe de Desenvolvimento',
        email: 'dev@empresa.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },

    // ========================================================================
    // SERVIDORES
    // ========================================================================
    servers: [
      {
        url: appConfig.baseUrl,
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'https://api.empresa.com',
        description: 'Servidor de Produção',
      },
    ],

    // ========================================================================
    // TAGS (AGRUPAMENTO DE ENDPOINTS)
    // ========================================================================
    tags: [
      {
        name: 'Health',
        description: 'Endpoints de saúde e monitoramento do sistema',
      },
      {
        name: 'Itens - Dados Cadastrais',
        description: 'Informações cadastrais completas de itens do ERP',
      },
      {
        name: 'Itens - Classificações',
        description: 'Classificações fiscais e hierarquias de itens',
      },
      {
        name: 'Cache',
        description: 'Gerenciamento e estatísticas de cache',
      },
      {
        name: 'Admin',
        description: 'Endpoints administrativos (requer permissão)',
      },
    ],

    // ========================================================================
    // COMPONENTES REUTILIZÁVEIS
    // ========================================================================
    components: {
      // ======================================================================
      // SCHEMAS (MODELOS DE DADOS)
      // ======================================================================
      schemas: {
        /**
         * Schema de erro padrão da API
         * Usado em todas as respostas de erro (4xx, 5xx)
         */
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Nome do erro ou categoria',
              example: 'ValidationError',
            },
            message: {
              type: 'string',
              description: 'Mensagem descritiva do erro',
              example: 'Código do item é obrigatório',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp ISO do erro',
              example: '2025-10-04T12:00:00.000Z',
            },
            path: {
              type: 'string',
              description: 'Caminho da requisição que gerou o erro',
              example: '/api/item/123/dados-cadastrais/informacoes-gerais',
            },
            correlationId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de correlação para rastreamento',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
          required: ['error', 'message', 'timestamp', 'path'],
        },

        /**
         * Schema de health check do sistema
         * Retorna status de banco, memória e disco
         */
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              description: 'Status geral do sistema',
              example: 'healthy',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp da verificação',
            },
            uptime: {
              type: 'number',
              description: 'Tempo de atividade do processo em segundos',
              example: 3600,
            },
            checks: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['ok', 'degraded', 'error'],
                      example: 'ok',
                    },
                    responseTime: {
                      type: 'number',
                      description: 'Tempo de resposta em ms',
                      example: 45,
                    },
                    connectionType: {
                      type: 'string',
                      description: 'Tipo de conexão (sqlserver, odbc, mock)',
                      example: 'sqlserver',
                    },
                    mode: {
                      type: 'string',
                      description: 'Modo de operação',
                      example: 'REAL_DATABASE',
                    },
                  },
                },
                memory: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['ok', 'warning', 'critical'],
                      example: 'ok',
                    },
                    used: {
                      type: 'number',
                      description: 'Memória usada em MB',
                      example: 512,
                    },
                    total: {
                      type: 'number',
                      description: 'Memória total em MB',
                      example: 2048,
                    },
                    percentage: {
                      type: 'number',
                      description: 'Percentual de uso',
                      example: 25,
                    },
                    free: {
                      type: 'number',
                      description: 'Memória livre em MB',
                      example: 1536,
                    },
                  },
                },
                disk: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['ok', 'warning', 'critical'],
                      example: 'ok',
                    },
                  },
                },
              },
            },
          },
        },

        /**
         * Schema de identificação de item
         * Dados básicos mestres do item
         */
        ItemIdentificacao: {
          type: 'object',
          properties: {
            codigo: {
              type: 'string',
              description: 'Código único do item no ERP',
              example: '7530110',
              maxLength: 16,
            },
            descricao: {
              type: 'string',
              description: 'Descrição completa do item',
              example: 'VALVULA DE ESFERA 1/2" BRONZE',
              maxLength: 120,
            },
            unidade: {
              type: 'string',
              description: 'Unidade de medida padrão',
              example: 'UN',
              maxLength: 2,
            },
          },
        },

        /**
         * Schema de unidades de medida alternativas
         */
        ItemUnidades: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              unidade: {
                type: 'string',
                description: 'Código da unidade de medida',
                example: 'CX',
              },
              fatorConversao: {
                type: 'number',
                format: 'float',
                description: 'Fator de conversão para unidade padrão',
                example: 12.0,
              },
              descricao: {
                type: 'string',
                description: 'Descrição da unidade',
                example: 'Caixa com 12 unidades',
              },
            },
          },
        },

        /**
         * Schema de características físicas do item
         */
        ItemCaracteristicasFisicas: {
          type: 'object',
          properties: {
            pesoLiquido: {
              type: 'number',
              format: 'float',
              description: 'Peso líquido em kg',
              example: 0.150,
            },
            pesoBruto: {
              type: 'number',
              format: 'float',
              description: 'Peso bruto em kg',
              example: 0.200,
            },
            volume: {
              type: 'number',
              format: 'float',
              description: 'Volume em m³',
              example: 0.00001,
            },
            altura: {
              type: 'number',
              format: 'float',
              description: 'Altura em cm',
              example: 2.0,
            },
            largura: {
              type: 'number',
              format: 'float',
              description: 'Largura em cm',
              example: 0.6,
            },
            comprimento: {
              type: 'number',
              format: 'float',
              description: 'Comprimento em cm',
              example: 0.6,
            },
          },
        },

        /**
         * Schema completo de informações gerais de um item
         * Agrega identificação, unidades e características físicas
         */
        InformacoesGerais: {
          type: 'object',
          properties: {
            identificacao: {
              $ref: '#/components/schemas/ItemIdentificacao',
            },
            unidades: {
              $ref: '#/components/schemas/ItemUnidades',
            },
            caracteristicasFisicas: {
              $ref: '#/components/schemas/ItemCaracteristicasFisicas',
            },
          },
        },
      },

      // ======================================================================
      // RESPONSES (RESPOSTAS REUTILIZÁVEIS)
      // ======================================================================
      responses: {
        /**
         * 400 Bad Request - Requisição inválida
         * Geralmente erro de validação de parâmetros
         */
        BadRequest: {
          description: 'Requisição inválida - Erro de validação',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'ValidationError',
                message: 'Código do item é obrigatório',
                timestamp: '2025-10-04T12:00:00.000Z',
                path: '/api/item//dados-cadastrais/informacoes-gerais',
                correlationId: '550e8400-e29b-41d4-a716-446655440000',
              },
            },
          },
        },

        /**
         * 404 Not Found - Recurso não encontrado
         */
        NotFound: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'ItemNotFoundError',
                message: 'Item ITEM999 não encontrado no sistema',
                timestamp: '2025-10-04T12:00:00.000Z',
                path: '/api/item/ITEM999/dados-cadastrais/informacoes-gerais',
                correlationId: '550e8400-e29b-41d4-a716-446655440000',
              },
            },
          },
        },

        /**
         * 429 Too Many Requests - Rate limit excedido
         */
        TooManyRequests: {
          description: 'Rate limit excedido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'RateLimitError',
                message:
                  'Muitas requisições. Tente novamente em alguns segundos.',
                timestamp: '2025-10-04T12:00:00.000Z',
                path: '/api/item/ITEM001/dados-cadastrais/informacoes-gerais',
                correlationId: '550e8400-e29b-41d4-a716-446655440000',
              },
            },
          },
        },

        /**
         * 500 Internal Server Error - Erro interno do servidor
         */
        InternalError: {
          description: 'Erro interno do servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'DatabaseError',
                message: 'Erro ao conectar com o banco de dados',
                timestamp: '2025-10-04T12:00:00.000Z',
                path: '/api/item/ITEM001/dados-cadastrais/informacoes-gerais',
                correlationId: '550e8400-e29b-41d4-a716-446655440000',
              },
            },
          },
        },
      },

      // ======================================================================
      // PARAMETERS (PARÂMETROS REUTILIZÁVEIS)
      // ======================================================================
      parameters: {
        /**
         * Parâmetro de path: código do item
         * Usado em múltiplos endpoints de consulta de item
         */
        ItemCodigo: {
          name: 'itemCodigo',
          in: 'path',
          required: true,
          description: 'Código único do item no sistema ERP (1-16 caracteres alfanuméricos)',
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 16,
            pattern: '^[A-Za-z0-9]+$',
          },
          example: '7530110',
        },

        /**
         * Header: Correlation ID (X-Correlation-ID)
         * Para rastreamento de requisições
         */
        CorrelationId: {
          name: 'X-Correlation-ID',
          in: 'header',
          required: false,
          description:
            'ID de correlação para rastreamento da requisição (gerado automaticamente se omitido)',
          schema: {
            type: 'string',
            format: 'uuid',
          },
          example: '550e8400-e29b-41d4-a716-446655440000',
        },

        /**
         * Header: API Key (X-API-Key)
         * Para autenticação e rate limiting personalizado
         */
        ApiKey: {
          name: 'X-API-Key',
          in: 'header',
          required: false,
          description: 'API Key para autenticação e rate limiting personalizado',
          schema: {
            type: 'string',
          },
          example: 'api_key_premium_abc123xyz789',
        },
      },
    },
  },

  // ==========================================================================
  // ARQUIVOS A SEREM ESCANEADOS
  // ==========================================================================

  /**
   * Caminhos dos arquivos a serem escaneados para anotações JSDoc/OpenAPI
   *
   * O swagger-jsdoc procura por comentários @openapi nesses arquivos
   * e os adiciona à documentação gerada.
   *
   * @note
   * Usar glob patterns para incluir múltiplos arquivos
   */
  apis: [
    './src/api/**/*.routes.ts', // Rotas da API
    './src/api/**/*.controller.ts', // Controllers (caso tenham anotações)
    './src/server.ts', // Endpoint raiz e configurações globais
  ],
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Especificação OpenAPI gerada
 *
 * Objeto final contendo toda a documentação da API no formato OpenAPI 3.0.
 * Usado pelo Swagger UI para renderizar a interface interativa.
 *
 * @constant
 * @example
 * ```typescript
 * // Servir JSON da especificação
 * app.get('/api-docs.json', (req, res) => {
 *   res.json(swaggerSpec);
 * });
 * ```
 */
export const swaggerSpec = swaggerJsdoc(options);

/**
 * Opções de customização do Swagger UI
 *
 * Personalização visual e comportamental da interface do Swagger.
 *
 * @constant
 * @example
 * ```typescript
 * // Servir Swagger UI
 * app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
 * ```
 */
export const swaggerUiOptions: SwaggerOptions = {
  /** CSS customizado para ocultar topbar padrão */
  customCss: '.swagger-ui .topbar { display: none }',

  /** Título da aba do navegador */
  customSiteTitle: 'Datasul API - Documentação',

  /** Ícone do site (favicon) */
  customfavIcon: '/favicon.ico',
};
