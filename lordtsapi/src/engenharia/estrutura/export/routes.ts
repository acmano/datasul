/**
 * Rotas de Exportação de Estruturas
 */

import { Router } from 'express';
import { ExportController } from './controller';

const router = Router();

/**
 * @openapi
 * /api/engenharia/estrutura/export/{itemCodigo}/{format}:
 *   get:
 *     summary: Exportar estrutura em CSV, XLSX ou PDF
 *     description: |
 *       Gera arquivo para download da estrutura do produto com cabeçalho formatado.
 *
 *       **Formatos disponíveis:**
 *       - **CSV**: Arquivo texto separado por ponto-e-vírgula, compatível com Excel
 *       - **XLSX**: Planilha Excel com múltiplas abas (Estrutura, Resumo Horas, Metadados)
 *       - **PDF**: Documento formatado para impressão ou visualização
 *
 *       **Cabeçalho incluído em todos os formatos:**
 *       - Código e descrição do item
 *       - Data de referência
 *       - Quantidade base
 *       - Data/hora de geração
 *     tags:
 *       - Engenharia - Estrutura - Exportação
 *     parameters:
 *       - in: path
 *         name: itemCodigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do item
 *         example: "7530110"
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, xlsx, pdf]
 *         description: Formato de exportação
 *         example: "xlsx"
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
 *         description: Arquivo gerado com sucesso
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Formato inválido
 *       404:
 *         description: Item não encontrado
 *       500:
 *         description: Erro ao gerar arquivo
 */
router.get('/:itemCodigo/:format', ExportController.exportEstrutura);

/**
 * @openapi
 * /api/engenharia/estrutura/export/{itemCodigo}/print:
 *   get:
 *     summary: Gerar PDF para impressão
 *     description: |
 *       Gera PDF otimizado para impressão direta no navegador.
 *       O arquivo é aberto inline (não força download).
 *
 *       Útil para:
 *       - Impressão direta do navegador
 *       - Visualização prévia antes de imprimir
 *       - Envio por email
 *     tags:
 *       - Engenharia - Estrutura - Exportação
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
 *         description: PDF gerado com sucesso
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Item não encontrado
 *       500:
 *         description: Erro ao gerar PDF
 */
router.get('/:itemCodigo/print', ExportController.printEstrutura);

export default router;
