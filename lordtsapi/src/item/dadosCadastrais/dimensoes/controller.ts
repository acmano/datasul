// src/item/dadosCadastrais/dimensoes/controller/index.ts

import { Request, Response, NextFunction } from 'express';
import { DimensoesService } from './service';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateItemCodigo } from '@shared/validators/paramValidators';

export class DimensoesController {
  static getDimensoes = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const itemCodigo = validateItemCodigo(req.params.itemCodigo);

    const result = await DimensoesService.getDimensoes(itemCodigo);

    if (!result) {
      throw new ItemNotFoundError(itemCodigo);
    }

    res.json({
      success: true,
      data: result,
    });
  });
}
