// src/grupoDeEstoque/dadosCadastrais/informacoesGerais/controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from './service';
import { GrupoDeEstoqueNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateGrupoDeEstoqueCodigo } from '@shared/validators/paramValidators';

export class InformacoesGeraisController {
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const grupoDeEstoqueCodigo = validateGrupoDeEstoqueCodigo(req.params.grupoDeEstoqueCodigo);

      const result = await InformacoesGeraisService.getInformacoesGerais(grupoDeEstoqueCodigo);

      if (!result) {
        throw new GrupoDeEstoqueNotFoundError(grupoDeEstoqueCodigo);
      }

      res.json({
        success: true,
        data: result,
      });
    }
  );
}