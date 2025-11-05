// src/item/extensao/controller.ts

import { Request, Response, NextFunction } from 'express';
import { ItemExtensaoService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

export class ItemExtensaoController {
  static listarTodos = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const extensoes = await ItemExtensaoService.listarTodos();

    res.json({
      success: true,
      data: extensoes,
      total: extensoes.length,
    });
  });

  static getByCodigo = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { itemCodigo } = req.params;

    const extensao = await ItemExtensaoService.getByCodigo(itemCodigo);

    res.json({
      success: true,
      data: extensao,
      correlationId: (req as any).id,
    });
  });
}
