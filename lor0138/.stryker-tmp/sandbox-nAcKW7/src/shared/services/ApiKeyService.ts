// @ts-nocheck
// src/shared/services/ApiKeyService.ts

import crypto from 'crypto';
import { ApiKeyConfig, UserTier } from '@shared/types/apiKey.types';
import { log } from '@shared/utils/logger';

/**
 * Serviço para gerenciar API Keys
 * Em produção, isso deveria vir de um banco de dados
 */
export class ApiKeyService {
  private static apiKeys: Map<string, ApiKeyConfig> = new Map();

  /**
   * Inicializa API keys de exemplo
   * Em produção, carregar do banco de dados
   */
  static initialize(): void {
    // API Keys de exemplo
    const exampleKeys: ApiKeyConfig[] = [
      {
        key: 'free-demo-key-123456',
        userId: 'user-001',
        userName: 'Demo User Free',
        tier: UserTier.FREE,
        active: true,
        createdAt: new Date(),
      },
      {
        key: 'premium-key-abc123',
        userId: 'user-002',
        userName: 'Premium User',
        tier: UserTier.PREMIUM,
        active: true,
        createdAt: new Date(),
      },
      {
        key: 'enterprise-key-xyz789',
        userId: 'user-003',
        userName: 'Enterprise Corp',
        tier: UserTier.ENTERPRISE,
        active: true,
        createdAt: new Date(),
      },
      {
        key: 'admin-key-superuser',
        userId: 'admin-001',
        userName: 'System Admin',
        tier: UserTier.ADMIN,
        active: true,
        createdAt: new Date(),
      },
    ];

    exampleKeys.forEach(key => {
      this.apiKeys.set(key.key, key);
    });

    log.info('API Keys inicializadas', {
      count: this.apiKeys.size,
      tiers: Array.from(new Set(exampleKeys.map(k => k.tier)))
    });
  }

  /**
   * Valida uma API Key
   */
  static async validateKey(apiKey: string): Promise<ApiKeyConfig | null> {
    const keyConfig = this.apiKeys.get(apiKey);

    if (!keyConfig) {
      log.warn('API Key inválida', { apiKey: this.maskKey(apiKey) });
      return null;
    }

    if (!keyConfig.active) {
      log.warn('API Key inativa', { 
        apiKey: this.maskKey(apiKey),
        userId: keyConfig.userId 
      });
      return null;
    }

    // Verificar expiração
    if (keyConfig.expiresAt && keyConfig.expiresAt < new Date()) {
      log.warn('API Key expirada', {
        apiKey: this.maskKey(apiKey),
        userId: keyConfig.userId,
        expiresAt: keyConfig.expiresAt
      });
      return null;
    }

    return keyConfig;
  }

  /**
   * Gera uma nova API Key
   */
  static async generateKey(
    userId: string,
    userName: string,
    tier: UserTier = UserTier.FREE,
    expiresInDays?: number
  ): Promise<string> {
    const prefix = tier.toLowerCase();
    const randomPart = crypto.randomBytes(16).toString('hex');
    const apiKey = `${prefix}-${randomPart}`;

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const keyConfig: ApiKeyConfig = {
      key: apiKey,
      userId,
      userName,
      tier,
      active: true,
      createdAt: new Date(),
      expiresAt,
    };

    this.apiKeys.set(apiKey, keyConfig);

    log.info('API Key gerada', {
      userId,
      tier,
      expiresAt,
      apiKey: this.maskKey(apiKey)
    });

    return apiKey;
  }

  /**
   * Revoga uma API Key
   */
  static async revokeKey(apiKey: string): Promise<boolean> {
    const keyConfig = this.apiKeys.get(apiKey);

    if (!keyConfig) {
      return false;
    }

    keyConfig.active = false;

    log.info('API Key revogada', {
      userId: keyConfig.userId,
      apiKey: this.maskKey(apiKey)
    });

    return true;
  }

  /**
   * Lista API Keys de um usuário
   */
  static async getUserKeys(userId: string): Promise<ApiKeyConfig[]> {
    return Array.from(this.apiKeys.values())
      .filter(key => key.userId === userId);
  }

  /**
   * Atualiza tier de um usuário
   */
  static async updateUserTier(userId: string, newTier: UserTier): Promise<void> {
    const userKeys = await this.getUserKeys(userId);

    userKeys.forEach(keyConfig => {
      keyConfig.tier = newTier;
    });

    log.info('Tier do usuário atualizado', {
      userId,
      newTier,
      keysUpdated: userKeys.length
    });
  }

  /**
   * Mascara API Key para logs
   */
  private static maskKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '***';
    }
    return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  }

  /**
   * Retorna estatísticas de API Keys
   */
  static getStats(): any {
    const keys = Array.from(this.apiKeys.values());
    
    return {
      total: keys.length,
      active: keys.filter(k => k.active).length,
      inactive: keys.filter(k => !k.active).length,
      byTier: {
        free: keys.filter(k => k.tier === UserTier.FREE).length,
        premium: keys.filter(k => k.tier === UserTier.PREMIUM).length,
        enterprise: keys.filter(k => k.tier === UserTier.ENTERPRISE).length,
        admin: keys.filter(k => k.tier === UserTier.ADMIN).length,
      }
    };
  }
}