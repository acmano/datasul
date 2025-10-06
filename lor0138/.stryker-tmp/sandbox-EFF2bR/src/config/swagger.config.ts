// @ts-nocheck
// src/config/swagger.config.ts
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
import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerOptions } from 'swagger-ui-express';
import { appConfig } from './app.config';
const options: swaggerJsdoc.Options = stryMutAct_9fa48("976") ? {} : (stryCov_9fa48("976"), {
  definition: stryMutAct_9fa48("977") ? {} : (stryCov_9fa48("977"), {
    openapi: stryMutAct_9fa48("978") ? "" : (stryCov_9fa48("978"), '3.0.0'),
    info: stryMutAct_9fa48("979") ? {} : (stryCov_9fa48("979"), {
      title: stryMutAct_9fa48("980") ? "" : (stryCov_9fa48("980"), 'Datasul API - Documentação'),
      version: stryMutAct_9fa48("981") ? "" : (stryCov_9fa48("981"), '1.0.0'),
      description: stryMutAct_9fa48("982") ? `` : (stryCov_9fa48("982"), `
        API para centralização de consultas de dados do ERP Totvs Datasul.

        ## Características
        - Consulta de dados cadastrais de itens
        - Suporte a múltiplas bases de dados (SQL Server, ODBC)
        - Rate limiting e proteção contra ataques
        - Logs estruturados e rastreamento de requisições

        ## Autenticação
        Atualmente a API não requer autenticação. (Implementar em produção!)
      `),
      contact: stryMutAct_9fa48("983") ? {} : (stryCov_9fa48("983"), {
        name: stryMutAct_9fa48("984") ? "" : (stryCov_9fa48("984"), 'Equipe de Desenvolvimento'),
        email: stryMutAct_9fa48("985") ? "" : (stryCov_9fa48("985"), 'dev@empresa.com')
      }),
      license: stryMutAct_9fa48("986") ? {} : (stryCov_9fa48("986"), {
        name: stryMutAct_9fa48("987") ? "" : (stryCov_9fa48("987"), 'MIT'),
        url: stryMutAct_9fa48("988") ? "" : (stryCov_9fa48("988"), 'https://opensource.org/licenses/MIT')
      })
    }),
    servers: stryMutAct_9fa48("989") ? [] : (stryCov_9fa48("989"), [stryMutAct_9fa48("990") ? {} : (stryCov_9fa48("990"), {
      url: appConfig.baseUrl,
      description: stryMutAct_9fa48("991") ? "" : (stryCov_9fa48("991"), 'Servidor de Desenvolvimento')
    }), stryMutAct_9fa48("992") ? {} : (stryCov_9fa48("992"), {
      url: stryMutAct_9fa48("993") ? "" : (stryCov_9fa48("993"), 'https://api.empresa.com'),
      description: stryMutAct_9fa48("994") ? "" : (stryCov_9fa48("994"), 'Servidor de Produção')
    })]),
    tags: stryMutAct_9fa48("995") ? [] : (stryCov_9fa48("995"), [stryMutAct_9fa48("996") ? {} : (stryCov_9fa48("996"), {
      name: stryMutAct_9fa48("997") ? "" : (stryCov_9fa48("997"), 'Health'),
      description: stryMutAct_9fa48("998") ? "" : (stryCov_9fa48("998"), 'Endpoints de saúde e monitoramento')
    }), stryMutAct_9fa48("999") ? {} : (stryCov_9fa48("999"), {
      name: stryMutAct_9fa48("1000") ? "" : (stryCov_9fa48("1000"), 'Itens - Dados Cadastrais'),
      description: stryMutAct_9fa48("1001") ? "" : (stryCov_9fa48("1001"), 'Informações cadastrais de itens')
    }), stryMutAct_9fa48("1002") ? {} : (stryCov_9fa48("1002"), {
      name: stryMutAct_9fa48("1003") ? "" : (stryCov_9fa48("1003"), 'Itens - Classificações'),
      description: stryMutAct_9fa48("1004") ? "" : (stryCov_9fa48("1004"), 'Classificações e hierarquias de itens')
    })]),
    components: stryMutAct_9fa48("1005") ? {} : (stryCov_9fa48("1005"), {
      schemas: stryMutAct_9fa48("1006") ? {} : (stryCov_9fa48("1006"), {
        Error: stryMutAct_9fa48("1007") ? {} : (stryCov_9fa48("1007"), {
          type: stryMutAct_9fa48("1008") ? "" : (stryCov_9fa48("1008"), 'object'),
          properties: stryMutAct_9fa48("1009") ? {} : (stryCov_9fa48("1009"), {
            error: stryMutAct_9fa48("1010") ? {} : (stryCov_9fa48("1010"), {
              type: stryMutAct_9fa48("1011") ? "" : (stryCov_9fa48("1011"), 'string'),
              example: stryMutAct_9fa48("1012") ? "" : (stryCov_9fa48("1012"), 'Erro ao processar requisição')
            }),
            message: stryMutAct_9fa48("1013") ? {} : (stryCov_9fa48("1013"), {
              type: stryMutAct_9fa48("1014") ? "" : (stryCov_9fa48("1014"), 'string'),
              example: stryMutAct_9fa48("1015") ? "" : (stryCov_9fa48("1015"), 'Detalhes do erro')
            }),
            timestamp: stryMutAct_9fa48("1016") ? {} : (stryCov_9fa48("1016"), {
              type: stryMutAct_9fa48("1017") ? "" : (stryCov_9fa48("1017"), 'string'),
              format: stryMutAct_9fa48("1018") ? "" : (stryCov_9fa48("1018"), 'date-time'),
              example: stryMutAct_9fa48("1019") ? "" : (stryCov_9fa48("1019"), '2025-10-04T12:00:00.000Z')
            }),
            path: stryMutAct_9fa48("1020") ? {} : (stryCov_9fa48("1020"), {
              type: stryMutAct_9fa48("1021") ? "" : (stryCov_9fa48("1021"), 'string'),
              example: stryMutAct_9fa48("1022") ? "" : (stryCov_9fa48("1022"), '/api/lor0138/item/123/dados-cadastrais/informacoes-gerais')
            }),
            requestId: stryMutAct_9fa48("1023") ? {} : (stryCov_9fa48("1023"), {
              type: stryMutAct_9fa48("1024") ? "" : (stryCov_9fa48("1024"), 'string'),
              format: stryMutAct_9fa48("1025") ? "" : (stryCov_9fa48("1025"), 'uuid'),
              example: stryMutAct_9fa48("1026") ? "" : (stryCov_9fa48("1026"), '550e8400-e29b-41d4-a716-446655440000')
            })
          })
        }),
        HealthCheck: stryMutAct_9fa48("1027") ? {} : (stryCov_9fa48("1027"), {
          type: stryMutAct_9fa48("1028") ? "" : (stryCov_9fa48("1028"), 'object'),
          properties: stryMutAct_9fa48("1029") ? {} : (stryCov_9fa48("1029"), {
            status: stryMutAct_9fa48("1030") ? {} : (stryCov_9fa48("1030"), {
              type: stryMutAct_9fa48("1031") ? "" : (stryCov_9fa48("1031"), 'string'),
              enum: stryMutAct_9fa48("1032") ? [] : (stryCov_9fa48("1032"), [stryMutAct_9fa48("1033") ? "" : (stryCov_9fa48("1033"), 'healthy'), stryMutAct_9fa48("1034") ? "" : (stryCov_9fa48("1034"), 'degraded'), stryMutAct_9fa48("1035") ? "" : (stryCov_9fa48("1035"), 'unhealthy')]),
              example: stryMutAct_9fa48("1036") ? "" : (stryCov_9fa48("1036"), 'healthy')
            }),
            timestamp: stryMutAct_9fa48("1037") ? {} : (stryCov_9fa48("1037"), {
              type: stryMutAct_9fa48("1038") ? "" : (stryCov_9fa48("1038"), 'string'),
              format: stryMutAct_9fa48("1039") ? "" : (stryCov_9fa48("1039"), 'date-time')
            }),
            uptime: stryMutAct_9fa48("1040") ? {} : (stryCov_9fa48("1040"), {
              type: stryMutAct_9fa48("1041") ? "" : (stryCov_9fa48("1041"), 'number'),
              description: stryMutAct_9fa48("1042") ? "" : (stryCov_9fa48("1042"), 'Tempo de atividade em segundos'),
              example: 3600
            }),
            database: stryMutAct_9fa48("1043") ? {} : (stryCov_9fa48("1043"), {
              type: stryMutAct_9fa48("1044") ? "" : (stryCov_9fa48("1044"), 'object'),
              properties: stryMutAct_9fa48("1045") ? {} : (stryCov_9fa48("1045"), {
                connected: stryMutAct_9fa48("1046") ? {} : (stryCov_9fa48("1046"), {
                  type: stryMutAct_9fa48("1047") ? "" : (stryCov_9fa48("1047"), 'boolean'),
                  example: stryMutAct_9fa48("1048") ? false : (stryCov_9fa48("1048"), true)
                }),
                responseTime: stryMutAct_9fa48("1049") ? {} : (stryCov_9fa48("1049"), {
                  type: stryMutAct_9fa48("1050") ? "" : (stryCov_9fa48("1050"), 'number'),
                  description: stryMutAct_9fa48("1051") ? "" : (stryCov_9fa48("1051"), 'Tempo de resposta em ms'),
                  example: 15
                }),
                type: stryMutAct_9fa48("1052") ? {} : (stryCov_9fa48("1052"), {
                  type: stryMutAct_9fa48("1053") ? "" : (stryCov_9fa48("1053"), 'string'),
                  example: stryMutAct_9fa48("1054") ? "" : (stryCov_9fa48("1054"), 'SQL Server')
                })
              })
            }),
            memory: stryMutAct_9fa48("1055") ? {} : (stryCov_9fa48("1055"), {
              type: stryMutAct_9fa48("1056") ? "" : (stryCov_9fa48("1056"), 'object'),
              properties: stryMutAct_9fa48("1057") ? {} : (stryCov_9fa48("1057"), {
                used: stryMutAct_9fa48("1058") ? {} : (stryCov_9fa48("1058"), {
                  type: stryMutAct_9fa48("1059") ? "" : (stryCov_9fa48("1059"), 'number'),
                  description: stryMutAct_9fa48("1060") ? "" : (stryCov_9fa48("1060"), 'Memória usada em MB'),
                  example: 120.5
                }),
                total: stryMutAct_9fa48("1061") ? {} : (stryCov_9fa48("1061"), {
                  type: stryMutAct_9fa48("1062") ? "" : (stryCov_9fa48("1062"), 'number'),
                  description: stryMutAct_9fa48("1063") ? "" : (stryCov_9fa48("1063"), 'Memória total em MB'),
                  example: 512
                }),
                percentage: stryMutAct_9fa48("1064") ? {} : (stryCov_9fa48("1064"), {
                  type: stryMutAct_9fa48("1065") ? "" : (stryCov_9fa48("1065"), 'number'),
                  description: stryMutAct_9fa48("1066") ? "" : (stryCov_9fa48("1066"), 'Percentual de uso'),
                  example: 23.5
                })
              })
            })
          })
        }),
        ItemIdentificacao: stryMutAct_9fa48("1067") ? {} : (stryCov_9fa48("1067"), {
          type: stryMutAct_9fa48("1068") ? "" : (stryCov_9fa48("1068"), 'object'),
          properties: stryMutAct_9fa48("1069") ? {} : (stryCov_9fa48("1069"), {
            codigo: stryMutAct_9fa48("1070") ? {} : (stryCov_9fa48("1070"), {
              type: stryMutAct_9fa48("1071") ? "" : (stryCov_9fa48("1071"), 'string'),
              description: stryMutAct_9fa48("1072") ? "" : (stryCov_9fa48("1072"), 'Código do item'),
              example: stryMutAct_9fa48("1073") ? "" : (stryCov_9fa48("1073"), 'ITEM001'),
              maxLength: 16
            }),
            descricao: stryMutAct_9fa48("1074") ? {} : (stryCov_9fa48("1074"), {
              type: stryMutAct_9fa48("1075") ? "" : (stryCov_9fa48("1075"), 'string'),
              description: stryMutAct_9fa48("1076") ? "" : (stryCov_9fa48("1076"), 'Descrição completa do item'),
              example: stryMutAct_9fa48("1077") ? "" : (stryCov_9fa48("1077"), 'Parafuso M6 x 20mm'),
              maxLength: 120
            }),
            descricaoReduzida: stryMutAct_9fa48("1078") ? {} : (stryCov_9fa48("1078"), {
              type: stryMutAct_9fa48("1079") ? "" : (stryCov_9fa48("1079"), 'string'),
              description: stryMutAct_9fa48("1080") ? "" : (stryCov_9fa48("1080"), 'Descrição resumida'),
              example: stryMutAct_9fa48("1081") ? "" : (stryCov_9fa48("1081"), 'Parafuso M6'),
              maxLength: 40
            }),
            nomeTecnico: stryMutAct_9fa48("1082") ? {} : (stryCov_9fa48("1082"), {
              type: stryMutAct_9fa48("1083") ? "" : (stryCov_9fa48("1083"), 'string'),
              description: stryMutAct_9fa48("1084") ? "" : (stryCov_9fa48("1084"), 'Nome técnico do produto'),
              example: stryMutAct_9fa48("1085") ? "" : (stryCov_9fa48("1085"), 'Parafuso sextavado M6x20'),
              maxLength: 80
            }),
            dataCadastro: stryMutAct_9fa48("1086") ? {} : (stryCov_9fa48("1086"), {
              type: stryMutAct_9fa48("1087") ? "" : (stryCov_9fa48("1087"), 'string'),
              format: stryMutAct_9fa48("1088") ? "" : (stryCov_9fa48("1088"), 'date'),
              description: stryMutAct_9fa48("1089") ? "" : (stryCov_9fa48("1089"), 'Data de cadastro do item'),
              example: stryMutAct_9fa48("1090") ? "" : (stryCov_9fa48("1090"), '2025-01-15')
            }),
            situacao: stryMutAct_9fa48("1091") ? {} : (stryCov_9fa48("1091"), {
              type: stryMutAct_9fa48("1092") ? "" : (stryCov_9fa48("1092"), 'string'),
              enum: stryMutAct_9fa48("1093") ? [] : (stryCov_9fa48("1093"), [stryMutAct_9fa48("1094") ? "" : (stryCov_9fa48("1094"), 'Ativo'), stryMutAct_9fa48("1095") ? "" : (stryCov_9fa48("1095"), 'Inativo'), stryMutAct_9fa48("1096") ? "" : (stryCov_9fa48("1096"), 'Bloqueado'), stryMutAct_9fa48("1097") ? "" : (stryCov_9fa48("1097"), 'Obsoleto')]),
              description: stryMutAct_9fa48("1098") ? "" : (stryCov_9fa48("1098"), 'Situação atual do item'),
              example: stryMutAct_9fa48("1099") ? "" : (stryCov_9fa48("1099"), 'Ativo')
            })
          }),
          required: stryMutAct_9fa48("1100") ? [] : (stryCov_9fa48("1100"), [stryMutAct_9fa48("1101") ? "" : (stryCov_9fa48("1101"), 'codigo'), stryMutAct_9fa48("1102") ? "" : (stryCov_9fa48("1102"), 'descricao')])
        }),
        ItemUnidades: stryMutAct_9fa48("1103") ? {} : (stryCov_9fa48("1103"), {
          type: stryMutAct_9fa48("1104") ? "" : (stryCov_9fa48("1104"), 'object'),
          properties: stryMutAct_9fa48("1105") ? {} : (stryCov_9fa48("1105"), {
            unidadeMedidaPrincipal: stryMutAct_9fa48("1106") ? {} : (stryCov_9fa48("1106"), {
              type: stryMutAct_9fa48("1107") ? "" : (stryCov_9fa48("1107"), 'string'),
              description: stryMutAct_9fa48("1108") ? "" : (stryCov_9fa48("1108"), 'Unidade de medida principal'),
              example: stryMutAct_9fa48("1109") ? "" : (stryCov_9fa48("1109"), 'PC'),
              maxLength: 2
            }),
            unidadeMedidaCompra: stryMutAct_9fa48("1110") ? {} : (stryCov_9fa48("1110"), {
              type: stryMutAct_9fa48("1111") ? "" : (stryCov_9fa48("1111"), 'string'),
              description: stryMutAct_9fa48("1112") ? "" : (stryCov_9fa48("1112"), 'Unidade de medida para compras'),
              example: stryMutAct_9fa48("1113") ? "" : (stryCov_9fa48("1113"), 'CX'),
              maxLength: 2
            }),
            unidadeMedidaVenda: stryMutAct_9fa48("1114") ? {} : (stryCov_9fa48("1114"), {
              type: stryMutAct_9fa48("1115") ? "" : (stryCov_9fa48("1115"), 'string'),
              description: stryMutAct_9fa48("1116") ? "" : (stryCov_9fa48("1116"), 'Unidade de medida para vendas'),
              example: stryMutAct_9fa48("1117") ? "" : (stryCov_9fa48("1117"), 'UN'),
              maxLength: 2
            }),
            fatorConversaoCompra: stryMutAct_9fa48("1118") ? {} : (stryCov_9fa48("1118"), {
              type: stryMutAct_9fa48("1119") ? "" : (stryCov_9fa48("1119"), 'number'),
              format: stryMutAct_9fa48("1120") ? "" : (stryCov_9fa48("1120"), 'float'),
              description: stryMutAct_9fa48("1121") ? "" : (stryCov_9fa48("1121"), 'Fator de conversão UM compra para UM principal'),
              example: 100
            }),
            fatorConversaoVenda: stryMutAct_9fa48("1122") ? {} : (stryCov_9fa48("1122"), {
              type: stryMutAct_9fa48("1123") ? "" : (stryCov_9fa48("1123"), 'number'),
              format: stryMutAct_9fa48("1124") ? "" : (stryCov_9fa48("1124"), 'float'),
              description: stryMutAct_9fa48("1125") ? "" : (stryCov_9fa48("1125"), 'Fator de conversão UM venda para UM principal'),
              example: 1
            })
          })
        }),
        ItemCaracteristicasFisicas: stryMutAct_9fa48("1126") ? {} : (stryCov_9fa48("1126"), {
          type: stryMutAct_9fa48("1127") ? "" : (stryCov_9fa48("1127"), 'object'),
          properties: stryMutAct_9fa48("1128") ? {} : (stryCov_9fa48("1128"), {
            pesoLiquido: stryMutAct_9fa48("1129") ? {} : (stryCov_9fa48("1129"), {
              type: stryMutAct_9fa48("1130") ? "" : (stryCov_9fa48("1130"), 'number'),
              format: stryMutAct_9fa48("1131") ? "" : (stryCov_9fa48("1131"), 'float'),
              description: stryMutAct_9fa48("1132") ? "" : (stryCov_9fa48("1132"), 'Peso líquido em kg'),
              example: 0.025
            }),
            pesoBruto: stryMutAct_9fa48("1133") ? {} : (stryCov_9fa48("1133"), {
              type: stryMutAct_9fa48("1134") ? "" : (stryCov_9fa48("1134"), 'number'),
              format: stryMutAct_9fa48("1135") ? "" : (stryCov_9fa48("1135"), 'float'),
              description: stryMutAct_9fa48("1136") ? "" : (stryCov_9fa48("1136"), 'Peso bruto em kg'),
              example: 0.030
            }),
            volume: stryMutAct_9fa48("1137") ? {} : (stryCov_9fa48("1137"), {
              type: stryMutAct_9fa48("1138") ? "" : (stryCov_9fa48("1138"), 'number'),
              format: stryMutAct_9fa48("1139") ? "" : (stryCov_9fa48("1139"), 'float'),
              description: stryMutAct_9fa48("1140") ? "" : (stryCov_9fa48("1140"), 'Volume em m³'),
              example: 0.00001
            }),
            altura: stryMutAct_9fa48("1141") ? {} : (stryCov_9fa48("1141"), {
              type: stryMutAct_9fa48("1142") ? "" : (stryCov_9fa48("1142"), 'number'),
              format: stryMutAct_9fa48("1143") ? "" : (stryCov_9fa48("1143"), 'float'),
              description: stryMutAct_9fa48("1144") ? "" : (stryCov_9fa48("1144"), 'Altura em cm'),
              example: 2.0
            }),
            largura: stryMutAct_9fa48("1145") ? {} : (stryCov_9fa48("1145"), {
              type: stryMutAct_9fa48("1146") ? "" : (stryCov_9fa48("1146"), 'number'),
              format: stryMutAct_9fa48("1147") ? "" : (stryCov_9fa48("1147"), 'float'),
              description: stryMutAct_9fa48("1148") ? "" : (stryCov_9fa48("1148"), 'Largura em cm'),
              example: 0.6
            }),
            comprimento: stryMutAct_9fa48("1149") ? {} : (stryCov_9fa48("1149"), {
              type: stryMutAct_9fa48("1150") ? "" : (stryCov_9fa48("1150"), 'number'),
              format: stryMutAct_9fa48("1151") ? "" : (stryCov_9fa48("1151"), 'float'),
              description: stryMutAct_9fa48("1152") ? "" : (stryCov_9fa48("1152"), 'Comprimento em cm'),
              example: 0.6
            })
          })
        }),
        InformacoesGerais: stryMutAct_9fa48("1153") ? {} : (stryCov_9fa48("1153"), {
          type: stryMutAct_9fa48("1154") ? "" : (stryCov_9fa48("1154"), 'object'),
          properties: stryMutAct_9fa48("1155") ? {} : (stryCov_9fa48("1155"), {
            identificacao: stryMutAct_9fa48("1156") ? {} : (stryCov_9fa48("1156"), {
              $ref: stryMutAct_9fa48("1157") ? "" : (stryCov_9fa48("1157"), '#/components/schemas/ItemIdentificacao')
            }),
            unidades: stryMutAct_9fa48("1158") ? {} : (stryCov_9fa48("1158"), {
              $ref: stryMutAct_9fa48("1159") ? "" : (stryCov_9fa48("1159"), '#/components/schemas/ItemUnidades')
            }),
            caracteristicasFisicas: stryMutAct_9fa48("1160") ? {} : (stryCov_9fa48("1160"), {
              $ref: stryMutAct_9fa48("1161") ? "" : (stryCov_9fa48("1161"), '#/components/schemas/ItemCaracteristicasFisicas')
            })
          })
        })
      }),
      responses: stryMutAct_9fa48("1162") ? {} : (stryCov_9fa48("1162"), {
        BadRequest: stryMutAct_9fa48("1163") ? {} : (stryCov_9fa48("1163"), {
          description: stryMutAct_9fa48("1164") ? "" : (stryCov_9fa48("1164"), 'Requisição inválida'),
          content: stryMutAct_9fa48("1165") ? {} : (stryCov_9fa48("1165"), {
            'application/json': stryMutAct_9fa48("1166") ? {} : (stryCov_9fa48("1166"), {
              schema: stryMutAct_9fa48("1167") ? {} : (stryCov_9fa48("1167"), {
                $ref: stryMutAct_9fa48("1168") ? "" : (stryCov_9fa48("1168"), '#/components/schemas/Error')
              }),
              example: stryMutAct_9fa48("1169") ? {} : (stryCov_9fa48("1169"), {
                error: stryMutAct_9fa48("1170") ? "" : (stryCov_9fa48("1170"), 'Validação falhou'),
                message: stryMutAct_9fa48("1171") ? "" : (stryCov_9fa48("1171"), 'Código do item é obrigatório'),
                timestamp: stryMutAct_9fa48("1172") ? "" : (stryCov_9fa48("1172"), '2025-10-04T12:00:00.000Z'),
                path: stryMutAct_9fa48("1173") ? "" : (stryCov_9fa48("1173"), '/api/lor0138/item//dados-cadastrais/informacoes-gerais'),
                requestId: stryMutAct_9fa48("1174") ? "" : (stryCov_9fa48("1174"), '550e8400-e29b-41d4-a716-446655440000')
              })
            })
          })
        }),
        NotFound: stryMutAct_9fa48("1175") ? {} : (stryCov_9fa48("1175"), {
          description: stryMutAct_9fa48("1176") ? "" : (stryCov_9fa48("1176"), 'Recurso não encontrado'),
          content: stryMutAct_9fa48("1177") ? {} : (stryCov_9fa48("1177"), {
            'application/json': stryMutAct_9fa48("1178") ? {} : (stryCov_9fa48("1178"), {
              schema: stryMutAct_9fa48("1179") ? {} : (stryCov_9fa48("1179"), {
                $ref: stryMutAct_9fa48("1180") ? "" : (stryCov_9fa48("1180"), '#/components/schemas/Error')
              }),
              example: stryMutAct_9fa48("1181") ? {} : (stryCov_9fa48("1181"), {
                error: stryMutAct_9fa48("1182") ? "" : (stryCov_9fa48("1182"), 'Item não encontrado'),
                message: stryMutAct_9fa48("1183") ? "" : (stryCov_9fa48("1183"), 'O item ITEM999 não existe no sistema'),
                timestamp: stryMutAct_9fa48("1184") ? "" : (stryCov_9fa48("1184"), '2025-10-04T12:00:00.000Z'),
                path: stryMutAct_9fa48("1185") ? "" : (stryCov_9fa48("1185"), '/api/lor0138/item/ITEM999/dados-cadastrais/informacoes-gerais'),
                requestId: stryMutAct_9fa48("1186") ? "" : (stryCov_9fa48("1186"), '550e8400-e29b-41d4-a716-446655440000')
              })
            })
          })
        }),
        InternalError: stryMutAct_9fa48("1187") ? {} : (stryCov_9fa48("1187"), {
          description: stryMutAct_9fa48("1188") ? "" : (stryCov_9fa48("1188"), 'Erro interno do servidor'),
          content: stryMutAct_9fa48("1189") ? {} : (stryCov_9fa48("1189"), {
            'application/json': stryMutAct_9fa48("1190") ? {} : (stryCov_9fa48("1190"), {
              schema: stryMutAct_9fa48("1191") ? {} : (stryCov_9fa48("1191"), {
                $ref: stryMutAct_9fa48("1192") ? "" : (stryCov_9fa48("1192"), '#/components/schemas/Error')
              }),
              example: stryMutAct_9fa48("1193") ? {} : (stryCov_9fa48("1193"), {
                error: stryMutAct_9fa48("1194") ? "" : (stryCov_9fa48("1194"), 'Erro interno'),
                message: stryMutAct_9fa48("1195") ? "" : (stryCov_9fa48("1195"), 'Erro ao conectar com o banco de dados'),
                timestamp: stryMutAct_9fa48("1196") ? "" : (stryCov_9fa48("1196"), '2025-10-04T12:00:00.000Z'),
                path: stryMutAct_9fa48("1197") ? "" : (stryCov_9fa48("1197"), '/api/lor0138/item/ITEM001/dados-cadastrais/informacoes-gerais'),
                requestId: stryMutAct_9fa48("1198") ? "" : (stryCov_9fa48("1198"), '550e8400-e29b-41d4-a716-446655440000')
              })
            })
          })
        }),
        TooManyRequests: stryMutAct_9fa48("1199") ? {} : (stryCov_9fa48("1199"), {
          description: stryMutAct_9fa48("1200") ? "" : (stryCov_9fa48("1200"), 'Limite de requisições excedido'),
          content: stryMutAct_9fa48("1201") ? {} : (stryCov_9fa48("1201"), {
            'application/json': stryMutAct_9fa48("1202") ? {} : (stryCov_9fa48("1202"), {
              schema: stryMutAct_9fa48("1203") ? {} : (stryCov_9fa48("1203"), {
                $ref: stryMutAct_9fa48("1204") ? "" : (stryCov_9fa48("1204"), '#/components/schemas/Error')
              }),
              example: stryMutAct_9fa48("1205") ? {} : (stryCov_9fa48("1205"), {
                error: stryMutAct_9fa48("1206") ? "" : (stryCov_9fa48("1206"), 'Rate limit excedido'),
                message: stryMutAct_9fa48("1207") ? "" : (stryCov_9fa48("1207"), 'Muitas requisições. Tente novamente em alguns segundos.'),
                timestamp: stryMutAct_9fa48("1208") ? "" : (stryCov_9fa48("1208"), '2025-10-04T12:00:00.000Z'),
                path: stryMutAct_9fa48("1209") ? "" : (stryCov_9fa48("1209"), '/api/lor0138/item/ITEM001/dados-cadastrais/informacoes-gerais'),
                requestId: stryMutAct_9fa48("1210") ? "" : (stryCov_9fa48("1210"), '550e8400-e29b-41d4-a716-446655440000')
              })
            })
          })
        })
      }),
      parameters: stryMutAct_9fa48("1211") ? {} : (stryCov_9fa48("1211"), {
        ItemCodigo: stryMutAct_9fa48("1212") ? {} : (stryCov_9fa48("1212"), {
          name: stryMutAct_9fa48("1213") ? "" : (stryCov_9fa48("1213"), 'itemCodigo'),
          in: stryMutAct_9fa48("1214") ? "" : (stryCov_9fa48("1214"), 'path'),
          required: stryMutAct_9fa48("1215") ? false : (stryCov_9fa48("1215"), true),
          description: stryMutAct_9fa48("1216") ? "" : (stryCov_9fa48("1216"), 'Código único do item no sistema'),
          schema: stryMutAct_9fa48("1217") ? {} : (stryCov_9fa48("1217"), {
            type: stryMutAct_9fa48("1218") ? "" : (stryCov_9fa48("1218"), 'string'),
            maxLength: 16,
            pattern: stryMutAct_9fa48("1219") ? "" : (stryCov_9fa48("1219"), '^[A-Z0-9-]+$')
          }),
          example: stryMutAct_9fa48("1220") ? "" : (stryCov_9fa48("1220"), 'ITEM001')
        }),
        RequestId: stryMutAct_9fa48("1221") ? {} : (stryCov_9fa48("1221"), {
          name: stryMutAct_9fa48("1222") ? "" : (stryCov_9fa48("1222"), 'X-Request-ID'),
          in: stryMutAct_9fa48("1223") ? "" : (stryCov_9fa48("1223"), 'header'),
          description: stryMutAct_9fa48("1224") ? "" : (stryCov_9fa48("1224"), 'ID único para rastreamento da requisição'),
          schema: stryMutAct_9fa48("1225") ? {} : (stryCov_9fa48("1225"), {
            type: stryMutAct_9fa48("1226") ? "" : (stryCov_9fa48("1226"), 'string'),
            format: stryMutAct_9fa48("1227") ? "" : (stryCov_9fa48("1227"), 'uuid')
          })
        })
      })
    })
  }),
  apis: stryMutAct_9fa48("1228") ? [] : (stryCov_9fa48("1228"), [stryMutAct_9fa48("1229") ? "" : (stryCov_9fa48("1229"), './src/api/**/*.routes.ts'), stryMutAct_9fa48("1230") ? "" : (stryCov_9fa48("1230"), './src/api/**/*.controller.ts'), stryMutAct_9fa48("1231") ? "" : (stryCov_9fa48("1231"), './src/server.ts')])
});
export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiOptions: SwaggerOptions = stryMutAct_9fa48("1232") ? {} : (stryCov_9fa48("1232"), {
  customCss: stryMutAct_9fa48("1233") ? "" : (stryCov_9fa48("1233"), '.swagger-ui .topbar { display: none }'),
  customSiteTitle: stryMutAct_9fa48("1234") ? "" : (stryCov_9fa48("1234"), 'Datasul API - Documentação'),
  customfavIcon: stryMutAct_9fa48("1235") ? "" : (stryCov_9fa48("1235"), '/favicon.ico')
});