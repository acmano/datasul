/**
 * Utilidades para gerenciamento de permissões de usuário
 * @module shared/utils/permissions
 */

/**
 * Permissões especiais disponíveis no sistema
 */
export enum Permission {
  /** Permite exportações ilimitadas sem rate limiting */
  EXPORT_UNLIMITED = 'export:unlimited',

  /** Permite bypass de rate limit em exportações */
  EXPORT_BYPASS_RATE_LIMIT = 'export:bypass-rate-limit',

  /** Acesso administrativo completo */
  ADMIN_FULL_ACCESS = 'admin:*',

  /** Gerenciar API keys */
  ADMIN_MANAGE_API_KEYS = 'admin:api-keys',

  /** Visualizar métricas do sistema */
  ADMIN_VIEW_METRICS = 'admin:metrics',
}

/**
 * Permissões padrão por tier de usuário
 */
export const DEFAULT_PERMISSIONS_BY_TIER: Record<string, Permission[]> = {
  free: [],
  premium: [Permission.EXPORT_UNLIMITED],
  enterprise: [Permission.EXPORT_UNLIMITED, Permission.EXPORT_BYPASS_RATE_LIMIT],
  admin: [
    Permission.EXPORT_UNLIMITED,
    Permission.EXPORT_BYPASS_RATE_LIMIT,
    Permission.ADMIN_FULL_ACCESS,
    Permission.ADMIN_MANAGE_API_KEYS,
    Permission.ADMIN_VIEW_METRICS,
  ],
};

/**
 * Verifica se um usuário tem uma permissão específica
 */
export function hasPermission(userPermissions: string[] | undefined, permission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // Verifica permissão exata
  if (userPermissions.includes(permission)) {
    return true;
  }

  // Verifica wildcard (admin:*)
  const permissionParts = permission.split(':');
  const wildcardPermission = `${permissionParts[0]}:*`;

  return userPermissions.includes(wildcardPermission);
}

/**
 * Verifica se usuário pode fazer exportações ilimitadas
 */
export function canExportUnlimited(userPermissions: string[] | undefined): boolean {
  return (
    hasPermission(userPermissions, Permission.EXPORT_UNLIMITED) ||
    hasPermission(userPermissions, Permission.EXPORT_BYPASS_RATE_LIMIT)
  );
}

/**
 * Adiciona permissões padrão baseadas no tier do usuário
 */
export function addDefaultPermissions(tier?: string): string[] {
  if (!tier) {
    return [];
  }

  return DEFAULT_PERMISSIONS_BY_TIER[tier] || [];
}

/**
 * Mescla permissões customizadas com permissões padrão do tier
 */
export function mergePermissions(customPermissions: string[] | undefined, tier?: string): string[] {
  const defaultPerms = addDefaultPermissions(tier);
  const customPerms = customPermissions || [];

  // Remove duplicatas
  return Array.from(new Set([...defaultPerms, ...customPerms]));
}
