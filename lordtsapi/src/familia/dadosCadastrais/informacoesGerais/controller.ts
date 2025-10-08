// src/familia/dadosCadastrais/informacoesGerais/controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateFamiliaCodigo } from '@shared/validators/paramValidators';

export class InformacoesGeraisController {
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const familiaCodigo = validateFamiliaCodigo(req.params.familiaCodigo);

      const result = await InformacoesGeraisService.getInformacoesGerais(familiaCodigo);

      // ← REMOVIDO: if (!result) throw new FamiliaNotFoundError
      // Service já lança erro internamente

      res.json({
        success: true,
        data: result,
      });
    }
  );
}