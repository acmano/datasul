// src/familia/listar/controller.ts

import { Request, Response, NextFunction } from 'express';
import { ListarService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

export class ListarController {
  static listarTodas = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const familias = await ListarService.listarTodas();

    res.json({
      success: true,
      data: familias,
      total: familias.length,
    });
  });
}
