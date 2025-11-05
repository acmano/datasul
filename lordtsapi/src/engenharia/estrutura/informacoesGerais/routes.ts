import { Router } from 'express';
import { EstruturaInformacoesGeraisController } from './controller';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';

const router = Router();

// ============================================================================
// MIDDLEWARES
// ============================================================================

const estruturaCache = cacheMiddleware({
  ttl: 1800, // 30 minutos (aumentado para melhor performance em produção)
  keyGenerator: (req) => {
    const itemCodigo = req.params.itemCodigo;
    const dataReferencia = req.query.dataReferencia;
    return dataReferencia ? `estrutura:${itemCodigo}:${dataReferencia}` : `estrutura:${itemCodigo}`;
  },
  condition: (req, res) => res.statusCode === 200,
});

const resumoCache = cacheMiddleware({
  ttl: 1800, // 30 minutos (aumentado para melhor performance em produção)
  keyGenerator: (req) => {
    const itemCodigo = req.params.itemCodigo;
    const dataReferencia = req.query.dataReferencia;
    return dataReferencia
      ? `estruturaResumo:${itemCodigo}:${dataReferencia}`
      : `estruturaResumo:${itemCodigo}`;
  },
  condition: (req, res) => res.statusCode === 200,
});

/**
 * @openapi
 * /api/engenharia/estrutura/informacoesGerais/{itemCodigo}:
 *   get:
 *     summary: Obter estrutura completa do produto (BOM) com processos
 *     description: |
 *       Retorna a estrutura completa de um produto (Bill of Materials - BOM) incluindo:
 *       - Árvore de componentes (estrutura recursiva)
 *       - Processos de fabricação de cada item
 *       - Operações, tempos, recursos
 *       - Resumo de horas por centro de custo
 *       - Metadata da consulta
 *     tags:
 *       - Engenharia - Estrutura
 *     parameters:
 *       - in: path
 *         name: itemCodigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do item principal
 *         example: "7530110"
 *       - in: query
 *         name: dataReferencia
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: Data de referência para considerar vigências (formato YYYY-MM-DD)
 *         example: "2025-01-15"
 *     responses:
 *       200:
 *         description: Estrutura retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     itemPrincipal:
 *                       type: object
 *                       description: Item raiz da estrutura (recursivo)
 *                       properties:
 *                         codigo:
 *                           type: string
 *                           example: "7530110"
 *                         estabelecimento:
 *                           type: string
 *                           example: "01.01"
 *                         descricao:
 *                           type: string
 *                           example: "RESISTÊNCIA 220V 5500W"
 *                         unidadeMedida:
 *                           type: string
 *                           example: "UN"
 *                         nivel:
 *                           type: integer
 *                           example: 0
 *                         quantidadeEstrutura:
 *                           type: number
 *                           nullable: true
 *                           example: null
 *                         quantidadeAcumulada:
 *                           type: number
 *                           example: 1.0
 *                         dataInicio:
 *                           type: string
 *                           format: date
 *                           nullable: true
 *                           description: Data de início de validade do componente (formato YYYY-MM-DD)
 *                           example: "2024-01-01"
 *                         dataFim:
 *                           type: string
 *                           format: date
 *                           nullable: true
 *                           description: Data de fim de validade do componente (formato YYYY-MM-DD)
 *                           example: "2025-12-31"
 *                         processoFabricacao:
 *                           type: object
 *                           properties:
 *                             operacao:
 *                               type: array
 *                               items:
 *                                 type: object
 *                         componentes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ItemEstrutura'
 *                     resumoHoras:
 *                       type: object
 *                       properties:
 *                         porCentroCusto:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               estabelecimento:
 *                                 type: string
 *                               centroCusto:
 *                                 type: string
 *                               descricao:
 *                                 type: string
 *                               totalHoras:
 *                                 type: number
 *                               horasHomem:
 *                                 type: number
 *                               horasMaquina:
 *                                 type: number
 *                         totais:
 *                           type: object
 *                           properties:
 *                             totalGeralHoras:
 *                               type: number
 *                             totalHorasHomem:
 *                               type: number
 *                             totalHorasMaquina:
 *                               type: number
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         dataGeracao:
 *                           type: string
 *                           format: date-time
 *                         itemPesquisado:
 *                           type: string
 *                         estabelecimentoPrincipal:
 *                           type: string
 *                         totalNiveis:
 *                           type: integer
 *                         totalItens:
 *                           type: integer
 *                         totalOperacoes:
 *                           type: integer
 *                 correlationId:
 *                   type: string
 *                   example: "abc123-def456-ghi789"
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Item não encontrado ou sem estrutura
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerError'
 */
router.get('/:itemCodigo', estruturaCache, EstruturaInformacoesGeraisController.getEstrutura);

/**
 * @openapi
 * /api/engenharia/estrutura/informacoesGerais/{itemCodigo}/resumo:
 *   get:
 *     summary: Obter apenas resumo da estrutura (sem árvore completa)
 *     description: |
 *       Retorna apenas metadata e resumo de horas, sem a árvore completa de componentes.
 *       Útil para dashboards e listagens que precisam apenas de informações sumarizadas.
 *     tags:
 *       - Engenharia - Estrutura
 *     parameters:
 *       - in: path
 *         name: itemCodigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do item
 *         example: "7530110"
 *       - in: query
 *         name: dataReferencia
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de referência (formato YYYY-MM-DD)
 *         example: "2025-01-15"
 *     responses:
 *       200:
 *         description: Resumo retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     resumoHoras:
 *                       type: object
 *                     metadata:
 *                       type: object
 *                 correlationId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:itemCodigo/resumo', resumoCache, EstruturaInformacoesGeraisController.getResumo);

/**
 * @openapi
 * /api/engenharia/estrutura/health:
 *   get:
 *     summary: Health check - verifica disponibilidade do serviço de estrutura
 *     description: |
 *       Verifica se a funcionalidade de estrutura está disponível.
 *       Retorna o status da stored procedure no banco de dados.
 *       Útil para monitoramento em produção.
 *     tags:
 *       - Engenharia - Estrutura
 *     responses:
 *       200:
 *         description: Status do serviço retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       example: true
 *                       description: Indica se o serviço está disponível
 *                     message:
 *                       type: string
 *                       example: "Serviço de estrutura disponível"
 *                 correlationId:
 *                   type: string
 *                   example: "abc123-def456-ghi789"
 *       500:
 *         description: Erro ao verificar disponibilidade
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerError'
 */
router.get('/health', EstruturaInformacoesGeraisController.healthCheck);

export default router;
