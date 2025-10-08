// @ts-nocheck
// src/api/lor0138/item/dadosCadastrais/informacoesGerais/controller/informacoesGerais.controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from '../service/informacoesGerais.service';
import { ItemNotFoundError, ValidationError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

export class InformacoesGeraisController {
  
  /**
   * GET /api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo
   */
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { itemCodigo } = req.params;

      // Validação
      if (!itemCodigo || itemCodigo.trim() === '') {
        throw new ValidationError('Código do item é obrigatório', {
          itemCodigo: 'Campo vazio ou ausente'
        });
      }

      if (itemCodigo.length > 16) {
        throw new ValidationError('Código do item inválido', {
          itemCodigo: 'Máximo de 16 caracteres'
        });
      }

      // Buscar dados
      const result = await InformacoesGeraisService.getInformacoesGerais(itemCodigo);

      // Se não encontrou, lançar erro específico
      if (!result) {
        throw new ItemNotFoundError(itemCodigo);
      }

      // Sucesso
      res.json({
        success: true,
        data: result,
      });
    }
  );
}

// Exemplo de controller SEM asyncHandler (forma antiga)
export class InformacoesGeraisControllerOld {
  
  static async getInformacoesGerais(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemCodigo } = req.params;

      if (!itemCodigo || itemCodigo.trim() === '') {
        throw new ValidationError('Código do item é obrigatório');
      }

      const result = await InformacoesGeraisService.getInformacoesGerais(itemCodigo);

      if (!result) {
        throw new ItemNotFoundError(itemCodigo);
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error); // Importante: passar erro para o middleware
    }
  }
}