// src/estabelecimento/dadosCadastrais/informacoesGerais/controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

export class InformacoesGeraisController {
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Params já validados pelo middleware validate()
      const { estabelecimentoCodigo } = req.params;

      const result = await InformacoesGeraisService.getInformacoesGerais(estabelecimentoCodigo);

      // Service já lança EstabelecimentoNotFoundError internamente

      res.json({
        success: true,
        data: result,
      });
    }
  );
}