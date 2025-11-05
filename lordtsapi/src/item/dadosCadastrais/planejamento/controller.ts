// src/item/dadosCadastrais/planejamento/controller.ts

import { Request, Response, NextFunction } from 'express';
import { PlanejamentoService } from './service';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateItemCodigo } from '@shared/validators/paramValidators';

export class PlanejamentoController {
  static getPlanejamento = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const itemCodigo = validateItemCodigo(req.params.itemCodigo);

      const result = await PlanejamentoService.getPlanejamento(itemCodigo);

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
