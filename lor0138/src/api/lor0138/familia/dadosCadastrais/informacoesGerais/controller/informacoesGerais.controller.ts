import { Request, Response, NextFunction } from 'express';
import { InformacoesGeraisService } from '../service/informacoesGerais.service';
import { FamiliaNotFoundError } from '@shared/errors/CustomErrors';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

export class InformacoesGeraisController {
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { familiaCodigo } = req.params; // Já validado e sanitizado pelo middleware

      const result = await InformacoesGeraisService.getInformacoesGerais(familiaCodigo);

      if (!result) {
        throw new FamiliaNotFoundError(familiaCodigo);
      }

      res.json({
        success: true,
        data: result,
      });
    }
  );
}