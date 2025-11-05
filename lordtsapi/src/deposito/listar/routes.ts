// src/deposito/listar/routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
import { log } from '@shared/utils/logger';

const router = Router();

const listCache = cacheMiddleware({
  ttl: 3600, // 1 hora (dados mudam pouco)
  keyGenerator: () => 'deposito:list:all',
  condition: (req, res) => res.statusCode === 200,
});

/**
 * @openapi
 * /:
 *   get:
 *     summary: Listar todos os depósitos
 *     description: |
 *       Retorna a lista completa de todos os depósitos cadastrados no ERP Datasul.
 *
 *       **Características:**
 *       - Cache de 1 hora para otimização (dados cadastrais mudam pouco)
 *       - Rate limiting por usuário/IP
 *       - Autenticação opcional por API Key
 *       - Timeout de 30 segundos
 *       - Dados ordenados por código
 *
 *       **Performance:**
 *       - Cache HIT: < 1ms
 *       - Cache MISS: ~200-1000ms (depende da quantidade de registros)
 *
 *       **Casos de Uso:**
 *       - Poplar dropdowns/selects em interfaces
 *       - Sincronização de dados cadastrais
 *       - Relatórios de gestão de estoque
 *       - Integração com sistemas WMS
 *       - Planejamento de produção e MRP
 *     tags:
 *       - Depósitos - Dados Cadastrais
 *     parameters:
 *       - name: X-Correlation-ID
 *         in: header
 *         required: false
 *         description: ID de correlação para rastreamento (gerado automaticamente se omitido)
 *         schema:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *       - name: X-API-Key
 *         in: header
 *         required: false
 *         description: API Key para autenticação e rate limiting personalizado
 *         schema:
 *           type: string
 *           example: 'api_key_premium_abc123xyz789'
 *     responses:
 *       200:
 *         description: Lista de depósitos retornada com sucesso
 *         headers:
 *           X-Correlation-ID:
 *             description: ID de correlação para rastreamento
 *             schema:
 *               type: string
 *               format: uuid
 *           X-Cache:
 *             description: Status do cache (HIT ou MISS)
 *             schema:
 *               type: string
 *               enum: [HIT, MISS]
 *           X-Cache-Key:
 *             description: Chave usada no cache
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Lista de depósitos
 *                   items:
 *                     type: object
 *                     properties:
 *                       codigo:
 *                         type: string
 *                         description: Código do depósito
 *                         example: '01'
 *                       nome:
 *                         type: string
 *                         description: Nome do depósito
 *                         example: 'DEPOSITO CENTRAL'
 *                       consideraSaldoDisponivel:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Considera saldo disponível
 *                         example: 'Sim'
 *                       consideraSaldoAlocado:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Considera saldo alocado
 *                         example: 'Sim'
 *                       permissaoMovDeposito1:
 *                         type: string
 *                         description: Permissão de movimentação 1
 *                         example: 'E'
 *                       permissaoMovDeposito2:
 *                         type: string
 *                         description: Permissão de movimentação 2
 *                         example: 'S'
 *                       permissaoMovDeposito3:
 *                         type: string
 *                         description: Permissão de movimentação 3
 *                         example: 'T'
 *                       produtoAcabado:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Depósito de produto acabado
 *                         example: 'Sim'
 *                       tipoDeposito:
 *                         type: string
 *                         enum: [Interno, Externo]
 *                         description: Tipo do depósito
 *                         example: 'Interno'
 *                       depositoProcesso:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Depósito de processo
 *                         example: 'Não'
 *                       nomeAbrev:
 *                         type: string
 *                         description: Nome abreviado
 *                         example: 'DEP CENTRAL'
 *                       saldoDisponivel:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Saldo disponível
 *                         example: 'Sim'
 *                       depositoCQ:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Depósito de controle de qualidade
 *                         example: 'Não'
 *                       depositoRejeito:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Depósito de rejeito
 *                         example: 'Não'
 *                       char1:
 *                         type: string
 *                         description: Campo customizável 1
 *                       char2:
 *                         type: string
 *                         description: Campo customizável 2
 *                       dec1:
 *                         type: number
 *                         description: Campo decimal 1
 *                       dec2:
 *                         type: number
 *                         description: Campo decimal 2
 *                       int1:
 *                         type: number
 *                         description: Campo inteiro 1
 *                       int2:
 *                         type: number
 *                         description: Campo inteiro 2
 *                       log1:
 *                         type: boolean
 *                         description: Campo lógico 1
 *                       log2:
 *                         type: boolean
 *                         description: Campo lógico 2
 *                       data1:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         description: Campo de data 1
 *                       data2:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         description: Campo de data 2
 *                       checkSum:
 *                         type: string
 *                         description: Checksum para validação
 *                       depositoReciclado:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Depósito de reciclagem
 *                         example: 'Não'
 *                       consideraOrdens:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Considera ordens MRP
 *                         example: 'Sim'
 *                       depositoWMS:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Depósito gerenciado por WMS
 *                         example: 'Não'
 *                       alocaSaldoERP:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Aloca saldo no ERP
 *                         example: 'Sim'
 *                       origemExterna:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Origem externa
 *                         example: 'Não'
 *                       depositoWmsExterno:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Depósito WMS externo
 *                         example: 'Não'
 *                       alocaSaldoWmsExterno:
 *                         type: string
 *                         enum: [Sim, Não]
 *                         description: Aloca saldo WMS externo
 *                         example: 'Não'
 *                 total:
 *                   type: number
 *                   description: Quantidade total de depósitos
 *                   example: 25
 *             examples:
 *               listaCompleta:
 *                 summary: Lista de depósitos
 *                 value:
 *                   success: true
 *                   data:
 *                     - codigo: '01'
 *                       nome: 'DEPOSITO CENTRAL'
 *                       consideraSaldoDisponivel: 'Sim'
 *                       consideraSaldoAlocado: 'Sim'
 *                       permissaoMovDeposito1: 'E'
 *                       permissaoMovDeposito2: 'S'
 *                       permissaoMovDeposito3: 'T'
 *                       produtoAcabado: 'Sim'
 *                       tipoDeposito: 'Interno'
 *                       depositoProcesso: 'Não'
 *                       nomeAbrev: 'DEP CENTRAL'
 *                       saldoDisponivel: 'Sim'
 *                       depositoCQ: 'Não'
 *                       depositoRejeito: 'Não'
 *                       char1: ''
 *                       char2: ''
 *                       dec1: 0
 *                       dec2: 0
 *                       int1: 0
 *                       int2: 0
 *                       log1: false
 *                       log2: false
 *                       data1: null
 *                       data2: null
 *                       checkSum: ''
 *                       depositoReciclado: 'Não'
 *                       consideraOrdens: 'Sim'
 *                       depositoWMS: 'Não'
 *                       alocaSaldoERP: 'Sim'
 *                       origemExterna: 'Não'
 *                       depositoWmsExterno: 'Não'
 *                       alocaSaldoWmsExterno: 'Não'
 *                     - codigo: '02'
 *                       nome: 'DEPOSITO EXPEDICAO'
 *                       consideraSaldoDisponivel: 'Sim'
 *                       consideraSaldoAlocado: 'Não'
 *                       permissaoMovDeposito1: 'E'
 *                       permissaoMovDeposito2: 'S'
 *                       permissaoMovDeposito3: ''
 *                       produtoAcabado: 'Sim'
 *                       tipoDeposito: 'Interno'
 *                       depositoProcesso: 'Não'
 *                       nomeAbrev: 'EXPEDICAO'
 *                       saldoDisponivel: 'Sim'
 *                       depositoCQ: 'Não'
 *                       depositoRejeito: 'Não'
 *                       char1: ''
 *                       char2: ''
 *                       dec1: 0
 *                       dec2: 0
 *                       int1: 0
 *                       int2: 0
 *                       log1: false
 *                       log2: false
 *                       data1: null
 *                       data2: null
 *                       checkSum: ''
 *                       depositoReciclado: 'Não'
 *                       consideraOrdens: 'Sim'
 *                       depositoWMS: 'Não'
 *                       alocaSaldoERP: 'Sim'
 *                       origemExterna: 'Não'
 *                       depositoWmsExterno: 'Não'
 *                       alocaSaldoWmsExterno: 'Não'
 *                   total: 2
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *       504:
 *         description: Gateway Timeout - Requisição excedeu o tempo limite
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: 'Timeout da requisição'
 *               message: 'A consulta ao banco de dados demorou mais de 30 segundos'
 *               timestamp: '2025-10-24T12:00:00.000Z'
 *               path: '/api/deposito/listar'
 *               correlationId: '550e8400-e29b-41d4-a716-446655440000'
 */
router.get(
  '/',
  optionalApiKeyAuth,
  userRateLimit,
  listCache,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ListarController } = await import('./controller');
      await ListarController.listarTodos(req, res, next);
    } catch (error) {
      log.error('Erro ao carregar controller:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        success: false,
        error: 'Erro interno ao processar requisição',
        message: 'Falha ao carregar módulo do controller',
        timestamp: new Date().toISOString(),
        path: req.path,
        correlationId: (req as any).id,
      });
    }
  }
);

export default router;
