// src/api/lor0138/item/dadosCadastrais/informacoesGerais/routes/informacoesGerais.routes.ts

import { Router, Request, Response } from 'express';
import { itemLimiter } from '@shared/middlewares/rateLimiter.middleware';

const router = Router();

/**
 * @openapi
 * /api/lor0138/item/dadosCadastrais/informacoesGerais/{itemCodigo}:
 *   get:
 *     summary: Obter informações gerais de um item
 *     description: |
 *       Retorna dados cadastrais completos de um item do Datasul, incluindo:
 *       - Dados gerais (código, descrição, pesos)
 *       - Unidades de medida com fatores de conversão
 *       - Estabelecimentos onde o item está cadastrado
 *       
 *       **Importante**: Os dados são consultados via Linked Server (OPENQUERY) 
 *       do SQL Server para o Progress OpenEdge.
 *       
 *       **Rate Limit**: 10 requisições por minuto para o mesmo item
 *     tags:
 *       - Item - Informações Gerais
 *     parameters:
 *       - in: path
 *         name: itemCodigo
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z0-9]+$'
 *           minLength: 1
 *           maxLength: 16
 *         description: Código do item (alfanumérico, máx 16 caracteres)
 *         example: '7530110'
 *     responses:
 *       200:
 *         description: Informações do item retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InformacoesGerais'
 *             examples:
 *               sucesso:
 *                 summary: Item encontrado com múltiplos estabelecimentos
 *                 value:
 *                   dadosGerais:
 *                     codigo: '7530110'
 *                     descricao: 'VALVULA DE ESFERA 1/2" BRONZE'
 *                     unidadeMedida: 'UN'
 *                     pesoLiquido: 0.150
 *                     pesoBruto: 0.200
 *                   unidadesMedida:
 *                     - unidade: 'UN'
 *                       fatorConversao: 1.0
 *                       descricao: 'Unidade'
 *                     - unidade: 'CX'
 *                       fatorConversao: 12.0
 *                       descricao: 'Caixa com 12 unidades'
 *                   estabelecimentos:
 *                     - codigo: '01.01'
 *                       nome: 'CD São Paulo'
 *                       ativo: true
 *                       estoqueAtual: 1500.0
 *                       estoqueMinimo: 100.0
 *                       localEstoque: 'A-12-03'
 *                     - codigo: '02.01'
 *                       nome: 'Fábrica Joinville'
 *                       ativo: true
 *                       estoqueAtual: 3200.0
 *                       estoqueMinimo: 500.0
 *                       localEstoque: 'B-05-12'
 *               itemSemEstabelecimentos:
 *                 summary: Item sem estabelecimentos cadastrados
 *                 value:
 *                   dadosGerais:
 *                     codigo: '7530110'
 *                     descricao: 'VALVULA DE ESFERA 1/2" BRONZE'
 *                     unidadeMedida: 'UN'
 *                     pesoLiquido: 0.150
 *                     pesoBruto: 0.200
 *                   unidadesMedida:
 *                     - unidade: 'UN'
 *                       fatorConversao: 1.0
 *                       descricao: 'Unidade'
 *                   estabelecimentos: []
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
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
 *               details: 'A consulta ao banco de dados demorou mais de 30 segundos'
 */
router.get('/:itemCodigo', itemLimiter, async (req: Request, res: Response) => {
  try {
    // Importação dinâmica para evitar problemas de circular dependency
    const { ItemInformacoesGeraisController } = await import('../controller/informacoesGerais.controller');
    
    // Chama o método do controller
    await ItemInformacoesGeraisController.getItemInformacoesGerais(req, res);
  } catch (error) {
    console.error('Erro ao carregar controller:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao processar requisição',
    });
  }
});

export default router;