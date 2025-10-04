// src/config/swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerOptions } from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
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
        
        ## Autenticação
        Atualmente a API não requer autenticação. (Implementar em produção!)
      `,
      contact: {
        name: 'Equipe de Desenvolvimento',
        email: 'dev@empresa.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.empresa.com',
        description: 'Servidor de Produção'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Endpoints de saúde e monitoramento'
      },
      {
        name: 'Itens - Dados Cadastrais',
        description: 'Informações cadastrais de itens'
      },
      {
        name: 'Itens - Classificações',
        description: 'Classificações e hierarquias de itens'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Erro ao processar requisição'
            },
            message: {
              type: 'string',
              example: 'Detalhes do erro'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-10-04T12:00:00.000Z'
            },
            path: {
              type: 'string',
              example: '/api/lor0138/item/123/dados-cadastrais/informacoes-gerais'
            },
            requestId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              example: 'healthy'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            uptime: {
              type: 'number',
              description: 'Tempo de atividade em segundos',
              example: 3600
            },
            database: {
              type: 'object',
              properties: {
                connected: {
                  type: 'boolean',
                  example: true
                },
                responseTime: {
                  type: 'number',
                  description: 'Tempo de resposta em ms',
                  example: 15
                },
                type: {
                  type: 'string',
                  example: 'SQL Server'
                }
              }
            },
            memory: {
              type: 'object',
              properties: {
                used: {
                  type: 'number',
                  description: 'Memória usada em MB',
                  example: 120.5
                },
                total: {
                  type: 'number',
                  description: 'Memória total em MB',
                  example: 512
                },
                percentage: {
                  type: 'number',
                  description: 'Percentual de uso',
                  example: 23.5
                }
              }
            }
          }
        },
        ItemIdentificacao: {
          type: 'object',
          properties: {
            codigo: {
              type: 'string',
              description: 'Código do item',
              example: 'ITEM001',
              maxLength: 16
            },
            descricao: {
              type: 'string',
              description: 'Descrição completa do item',
              example: 'Parafuso M6 x 20mm',
              maxLength: 120
            },
            descricaoReduzida: {
              type: 'string',
              description: 'Descrição resumida',
              example: 'Parafuso M6',
              maxLength: 40
            },
            nomeTecnico: {
              type: 'string',
              description: 'Nome técnico do produto',
              example: 'Parafuso sextavado M6x20',
              maxLength: 80
            },
            dataCadastro: {
              type: 'string',
              format: 'date',
              description: 'Data de cadastro do item',
              example: '2025-01-15'
            },
            situacao: {
              type: 'string',
              enum: ['Ativo', 'Inativo', 'Bloqueado', 'Obsoleto'],
              description: 'Situação atual do item',
              example: 'Ativo'
            }
          },
          required: ['codigo', 'descricao']
        },
        ItemUnidades: {
          type: 'object',
          properties: {
            unidadeMedidaPrincipal: {
              type: 'string',
              description: 'Unidade de medida principal',
              example: 'PC',
              maxLength: 2
            },
            unidadeMedidaCompra: {
              type: 'string',
              description: 'Unidade de medida para compras',
              example: 'CX',
              maxLength: 2
            },
            unidadeMedidaVenda: {
              type: 'string',
              description: 'Unidade de medida para vendas',
              example: 'UN',
              maxLength: 2
            },
            fatorConversaoCompra: {
              type: 'number',
              format: 'float',
              description: 'Fator de conversão UM compra para UM principal',
              example: 100
            },
            fatorConversaoVenda: {
              type: 'number',
              format: 'float',
              description: 'Fator de conversão UM venda para UM principal',
              example: 1
            }
          }
        },
        ItemCaracteristicasFisicas: {
          type: 'object',
          properties: {
            pesoLiquido: {
              type: 'number',
              format: 'float',
              description: 'Peso líquido em kg',
              example: 0.025
            },
            pesoBruto: {
              type: 'number',
              format: 'float',
              description: 'Peso bruto em kg',
              example: 0.030
            },
            volume: {
              type: 'number',
              format: 'float',
              description: 'Volume em m³',
              example: 0.00001
            },
            altura: {
              type: 'number',
              format: 'float',
              description: 'Altura em cm',
              example: 2.0
            },
            largura: {
              type: 'number',
              format: 'float',
              description: 'Largura em cm',
              example: 0.6
            },
            comprimento: {
              type: 'number',
              format: 'float',
              description: 'Comprimento em cm',
              example: 0.6
            }
          }
        },
        InformacoesGerais: {
          type: 'object',
          properties: {
            identificacao: {
              $ref: '#/components/schemas/ItemIdentificacao'
            },
            unidades: {
              $ref: '#/components/schemas/ItemUnidades'
            },
            caracteristicasFisicas: {
              $ref: '#/components/schemas/ItemCaracteristicasFisicas'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Requisição inválida',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Validação falhou',
                message: 'Código do item é obrigatório',
                timestamp: '2025-10-04T12:00:00.000Z',
                path: '/api/lor0138/item//dados-cadastrais/informacoes-gerais',
                requestId: '550e8400-e29b-41d4-a716-446655440000'
              }
            }
          }
        },
        NotFound: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Item não encontrado',
                message: 'O item ITEM999 não existe no sistema',
                timestamp: '2025-10-04T12:00:00.000Z',
                path: '/api/lor0138/item/ITEM999/dados-cadastrais/informacoes-gerais',
                requestId: '550e8400-e29b-41d4-a716-446655440000'
              }
            }
          }
        },
        InternalError: {
          description: 'Erro interno do servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Erro interno',
                message: 'Erro ao conectar com o banco de dados',
                timestamp: '2025-10-04T12:00:00.000Z',
                path: '/api/lor0138/item/ITEM001/dados-cadastrais/informacoes-gerais',
                requestId: '550e8400-e29b-41d4-a716-446655440000'
              }
            }
          }
        },
        TooManyRequests: {
          description: 'Limite de requisições excedido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Rate limit excedido',
                message: 'Muitas requisições. Tente novamente em alguns segundos.',
                timestamp: '2025-10-04T12:00:00.000Z',
                path: '/api/lor0138/item/ITEM001/dados-cadastrais/informacoes-gerais',
                requestId: '550e8400-e29b-41d4-a716-446655440000'
              }
            }
          }
        }
      },
      parameters: {
        ItemCodigo: {
          name: 'itemCodigo',
          in: 'path',
          required: true,
          description: 'Código único do item no sistema',
          schema: {
            type: 'string',
            maxLength: 16,
            pattern: '^[A-Z0-9-]+$'
          },
          example: 'ITEM001'
        },
        RequestId: {
          name: 'X-Request-ID',
          in: 'header',
          description: 'ID único para rastreamento da requisição',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      }
    }
  },
  apis: [
    './src/api/**/*.routes.ts',
    './src/api/**/*.controller.ts',
    './src/server.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);

export const swaggerUiOptions: SwaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Datasul API - Documentação',
  customfavIcon: '/favicon.ico'
};