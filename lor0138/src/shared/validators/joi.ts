import JoiBase from 'joi';
import { secureCodeExtension } from './joi/extensions/secureCode.extension';

export const ExtendedJoi = JoiBase.extend(secureCodeExtension);
export { JoiBase as Joi };