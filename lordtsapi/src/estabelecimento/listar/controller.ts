// src/estabelecimento/listar/controller.ts

import { Request, Response, NextFunction } from 'express';
import { ListarService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

export class ListarController {
  static listarTodos = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const estabelecimentos = await ListarService.listarTodos();

    res.json({
      success: true,
      data: estabelecimentos,
      total: estabelecimentos.length,
    });
  });
}
