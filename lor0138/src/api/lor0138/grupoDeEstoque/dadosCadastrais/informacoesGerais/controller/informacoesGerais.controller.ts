// src/api/lor0138/grupoDeEstoque/dadosCadastrais/informacoesGerais/controller/informacoesGerais.controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from '../service/informacoesGerais.service';
import { GrupoDeEstoqueNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

export class InformacoesGeraisController {
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { grupoDeEstoqueCodigo } = req.params; // ✅ CORRIGIDO

      const result = await InformacoesGeraisService.getInformacoesGerais(grupoDeEstoqueCodigo);

      if (!result) {
        throw new GrupoDeEstoqueNotFoundError(grupoDeEstoqueCodigo); // ✅ CORRIGIDO
      }

      res.json({
        success: true,
        data: result,
      });
    }
  );
}