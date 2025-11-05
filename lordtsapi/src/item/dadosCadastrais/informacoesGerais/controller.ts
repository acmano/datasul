// src/item/dadosCadastrais/informacoesGerais/controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from './service';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateItemCodigo } from '@shared/validators/paramValidators';

export class InformacoesGeraisController {
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const itemCodigo = validateItemCodigo(req.params.itemCodigo);

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
