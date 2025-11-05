/**
 * Backward compatibility exports for api module
 *
 * ⚠️ DEPRECATED - Use @presentation/* instead
 *
 * Esta pasta foi movida para src/presentation/ seguindo Clean Architecture.
 * Estes exports são mantidos por compatibilidade com código legado.
 *
 * @deprecated Use @presentation/admin, @presentation/metrics, @presentation/test
 * @see src/presentation/
 * @module api
 */

// ⚠️ DEPRECATED - Use @presentation/admin
export { adminRoutes } from '../presentation/admin';

// ⚠️ DEPRECATED - Use @presentation/metrics
export { metricsRoutes } from '../presentation/metrics';

// ⚠️ DEPRECATED - Use @presentation/test
export { testTimeoutRoutes } from '../presentation/test';
