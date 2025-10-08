// src/api/lor0138/item/dadosCadastrais/informacoesGerais/controller/informacoesGerais.controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from '../service/informacoesGerais.service';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

/**
 * Controller - Informações Gerais do Item (estrutura aninhada)
 */
export class InformacoesGeraisController {

  /**
   * Busca informações gerais do item com estrutura aninhada
   */
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { itemCodigo } = req.params; // Já validado pelo middleware

      const result = await InformacoesGeraisService.getInformacoesGerais(itemCodigo);

      if (!result) {
        throw new ItemNotFoundError(itemCodigo);
      }

      res.json({
        success: true,
        data: result,
      });
    }
  );
}