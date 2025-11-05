// src/familiaComercial/dadosCadastrais/informacoesGerais/controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from './service';
import { FamiliaComercialNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateFamiliaComercialCodigo } from '@shared/validators/paramValidators';

export class InformacoesGeraisController {
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const familiaComercialCodigo = validateFamiliaComercialCodigo(
        req.params.familiaComercialCodigo
      );

      const result = await InformacoesGeraisService.getInformacoesGerais(familiaComercialCodigo);

      if (!result) {
        throw new FamiliaComercialNotFoundError(familiaComercialCodigo);
      }

      res.json({
        success: true,
        data: result,
      });
    }
  );
}
