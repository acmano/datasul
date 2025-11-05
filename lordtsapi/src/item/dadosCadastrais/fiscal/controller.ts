// src/item/dadosCadastrais/fiscal/controller.ts

import { Request, Response, NextFunction } from 'express';
import { FiscalService } from './service';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateItemCodigo } from '@shared/validators/paramValidators';

export class FiscalController {
  static getFiscal = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const itemCodigo = validateItemCodigo(req.params.itemCodigo);

    const result = await FiscalService.getFiscal(itemCodigo);

    if (!result) {
      throw new ItemNotFoundError(itemCodigo);
    }

    res.json({
      success: true,
      data: result,
    });
  });
}
