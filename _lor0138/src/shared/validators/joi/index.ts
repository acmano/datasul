import Joi from 'joi';
import { secureCodeExtension } from './extensions/secureCode.extension';

export const ExtendedJoi = Joi.extend(secureCodeExtension);
export { Joi }; // Export original também