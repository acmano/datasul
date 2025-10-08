// src/api/lor0138/estabelecimento/dadosCadastrais/informacoesGerais/controller/informacoesGerais.controller.ts

import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from '../service/informacoesGerais.service';
import { EstabelecimentoNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

/**
 * Controller - Informações Gerais do Estabelecimento
 */
export class InformacoesGeraisController {

  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { estabelecimentoCodigo } = req.params;

      const result = await InformacoesGeraisService.getInformacoesGerais(estabelecimentoCodigo);

      if (!result) {
        throw new EstabelecimentoNotFoundError(estabelecimentoCodigo);
      }

      res.json({
        success: true,
        data: result,
      });
    }
  );
}