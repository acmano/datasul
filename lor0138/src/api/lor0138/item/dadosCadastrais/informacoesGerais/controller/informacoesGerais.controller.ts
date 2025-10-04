// src/api/lor0138/item/dadosCadastrais/informacoesGerais/controller/informacoesGerais.controller.ts

import { Request, Response } from 'express';
import { ItemInformacoesGeraisService } from '../service/informacoesGerais.service';
import { validateItemInformacoesGeraisRequest } from '../validators/informacoesGerais.validators';

/**
 * Controller para endpoints de Informações Gerais
 */
export class ItemInformacoesGeraisController {
  /**
   * GET /api/lor0138/item/:itemCodigo/dados-cadastrais/informacoes-gerais
   * Busca informações gerais de um item
   */
  static async getItemInformacoesGerais(req: Request, res: Response): Promise<void> {
    try {
      // Valida parâmetros
      const validation = validateItemInformacoesGeraisRequest({
        itemCodigo: req.params.itemCodigo,
      });

      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: validation.error,
        });
        return;
      }

      // Busca dados
      const result = await ItemInformacoesGeraisService.getItemInformacoesGerais(
        validation.data!.itemCodigo
      );

      // Retorna resposta
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error === 'Item não encontrado' ? 404 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('Erro no controller:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
}