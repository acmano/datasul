// src/grupoDeEstoque/listar/controller.ts

import { Request, Response, NextFunction } from 'express';
import { ListarService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

export class ListarController {
  static listarTodos = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
      const gruposDeEstoque = await ListarService.listarTodos();

      res.json({
        success: true,
        data: gruposDeEstoque,
        total: gruposDeEstoque.length,
      });
    }
  );
}
