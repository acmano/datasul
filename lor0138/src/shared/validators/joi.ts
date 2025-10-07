// src/shared/validators/joi.ts

import Joi from 'joi';
// Update the import path if the file name or location is different
// Example: import { secureCodeExtension } from './extensions/secureCodeExtension';
// Make sure the file exists at the specified path
import { secureCodeExtension } from './joi/extensions/secureCode.extension';

/**
 * ExtendedJoi com tipo customizado secureCode
 * @module ExtendedJoi
 * @category Validators
 */
export const ExtendedJoi = Joi.extend(secureCodeExtension);

/**
 * Joi original (sem extensões)
 * Use para validações que não precisam de secureCode
 */
export { Joi };