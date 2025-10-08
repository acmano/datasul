import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from '../service/informacoesGerais.service';
import { FamiliaComercialNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

export class InformacoesGeraisController {
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { familiaComercialCodigo } = req.params; // Já validado e sanitizado pelo middleware

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