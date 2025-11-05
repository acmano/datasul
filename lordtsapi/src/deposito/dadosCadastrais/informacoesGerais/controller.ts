// src/deposito/dadosCadastrais/informacoesGerais/controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateDepositoCodigo } from '@shared/validators/paramValidators';

export class InformacoesGeraisController {
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const depositoCodigo = validateDepositoCodigo(req.params.depositoCodigo);

      const result = await InformacoesGeraisService.getInformacoesGerais(depositoCodigo);

      // Service já lança erro internamente se não encontrar

      res.json({
        success: true,
        data: result,
      });
    }
  );
}
