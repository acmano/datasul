// src/item/dadosCadastrais/manufatura/controller.ts

import { Request, Response, NextFunction } from 'express';
import { ManufaturaService } from './service';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateItemCodigo } from '@shared/validators/paramValidators';

export class ManufaturaController {
  static getManufatura = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const itemCodigo = validateItemCodigo(req.params.itemCodigo);

    const result = await ManufaturaService.getManufatura(itemCodigo);

    if (!result) {
      throw new ItemNotFoundError(itemCodigo);
    }

    res.json({
      success: true,
      data: result,
    });
  });
}
