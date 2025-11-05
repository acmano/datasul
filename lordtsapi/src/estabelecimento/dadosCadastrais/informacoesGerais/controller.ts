// src/estabelecimento/dadosCadastrais/informacoesGerais/controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from './service';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { validateEstabelecimentoCodigo } from '@shared/validators/paramValidators';

export class InformacoesGeraisController {
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const estabelecimentoCodigo = validateEstabelecimentoCodigo(req.params.estabelecimentoCodigo);

      const result = await InformacoesGeraisService.getInformacoesGerais(estabelecimentoCodigo);

      // Service já lança EstabelecimentoNotFoundError internamente

      res.json({
        success: true,
        data: result,
      });
    }
  );
}
