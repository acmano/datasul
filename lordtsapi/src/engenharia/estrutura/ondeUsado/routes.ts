/**
 * Rotas de Onde Usado (Where Used)
 * Consulta inversa da estrutura de produtos
 */

import { Router } from 'express';
import { query } from 'express-validator';
import { OndeUsadoController } from './controller';

const router = Router();

/**
 * @openapi
 * /api/engenharia/estrutura/ondeUsado/{itemCodigo}:
 *   get:
 *     summary: Buscar onde um componente é usado (Where Used)
 *     description: |
 *       Retorna a estrutura inversa mostrando em quais produtos um componente é utilizado.
 *
 *       **Diferença entre Estrutura e Onde Usado:**
 *       - **Estrutura (BOM)**: Partindo de um produto pai, desce mostrando todos os componentes
 *       - **Onde Usado**: Partindo de um componente, sobe mostrando todos os produtos que o utilizam
 *
 *       **Exemplo:**
 *       - Estrutura de MAXI DUCHA: MAXI DUCHA → RESISTÊNCIA → FIO DE COBRE
 *       - Onde Usado do FIO DE COBRE: FIO DE COBRE → usado em RESISTÊNCIA → usada em MAXI DUCHA
 *
 *       **Performance:**
 *       - Usa processamento em lote (BFS) otimizado
 *       - Cache de 5 minutos
 *       - Circuit Breaker para proteção contra falhas do Linked Server
 *
 *     tags:
 *       - Engenharia - Estrutura - Onde Usado
 *     parameters:
 *       - in: path
 *         name: itemCodigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do componente a pesquisar
 *         example: "310064"
 *       - in: query
 *         name: dataReferencia
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de referência para vigência (formato YYYY-MM-DD)
 *         example: "2025-01-15"
 *       - in: query
 *         name: apenasFinais
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Se true, retorna apenas lista simples dos leafs com tipo=FINAL (sem estrutura hierárquica)
 *         example: false
 *     responses:
 *       200:
 *         description: Sucesso - Retorna estrutura de onde usado
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
 *                       description: Componente pesquisado (raiz)
 *                       properties:
 *                         codigo:
 *                           type: string
 *                           example: "310064"
 *                         descricao:
 *                           type: string
 *                           example: "MASTER BCO 100%"
 *                         nivel:
 *                           type: integer
 *                           example: 0
 *                         usadoEm:
 *                           type: array
 *                           description: Array de itens que usam este componente
 *                           items:
 *                             type: object
 *                     resumoHoras:
 *                       type: object
 *                       description: Resumo consolidado de horas
 *                     metadata:
 *                       type: object
 *                       description: Metadados da consulta
 *                       properties:
 *                         totalNiveis:
 *                           type: integer
 *                           example: 3
 *                         totalItens:
 *                           type: integer
 *                           example: 15
 *                 correlationId:
 *                   type: string
 *                   description: ID de correlação da requisição
 *       400:
 *         description: Requisição inválida (código vazio ou data inválida)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ValidationError"
 *                 message:
 *                   type: string
 *                   example: "Código do item é obrigatório"
 *       404:
 *         description: Item não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ItemNotFoundError"
 *                 message:
 *                   type: string
 *                   example: "Item 999999 não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *       503:
 *         description: Linked Server indisponível (Circuit Breaker aberto)
 */
router.get(
  '/:itemCodigo',
  [query('apenasFinais').optional().isBoolean().withMessage('apenasFinais deve ser boolean')],
  OndeUsadoController.getOndeUsado
);

/**
 * @openapi
 * /api/engenharia/estrutura/ondeUsado/cache/{itemCodigo}:
 *   delete:
 *     summary: Invalidar cache de onde usado de um item
 *     description: |
 *       Remove do cache todas as entradas de onde usado relacionadas a um item específico.
 *
 *       **Quando usar:**
 *       - Após alterações na estrutura do produto
 *       - Quando detectar dados desatualizados
 *       - Em operações de manutenção programada
 *
 *     tags:
 *       - Engenharia - Estrutura - Onde Usado
 *     parameters:
 *       - in: path
 *         name: itemCodigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do item
 *         example: "310064"
 *     responses:
 *       200:
 *         description: Cache invalidado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cache de onde usado invalidado para o item 310064"
 *                 correlationId:
 *                   type: string
 *       500:
 *         description: Erro ao invalidar cache
 */
router.delete('/cache/:itemCodigo', OndeUsadoController.invalidarCache);

/**
 * @openapi
 * /api/engenharia/estrutura/ondeUsado/cache:
 *   delete:
 *     summary: Invalidar TODO o cache de onde usado
 *     description: |
 *       Remove TODAS as entradas de cache de onde usado.
 *
 *       **ATENÇÃO:** Operação pesada que pode impactar performance temporariamente.
 *
 *       **Quando usar:**
 *       - Após migrações ou importações em massa
 *       - Em manutenções programadas
 *       - Quando suspeitar de corrupção generalizada de cache
 *
 *     tags:
 *       - Engenharia - Estrutura - Onde Usado
 *     responses:
 *       200:
 *         description: Cache invalidado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Todo cache de onde usado foi invalidado"
 *                 correlationId:
 *                   type: string
 *       500:
 *         description: Erro ao invalidar cache
 */
router.delete('/cache', OndeUsadoController.invalidarTodoCache);

export default router;
