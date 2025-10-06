// src/config/app.config.ts
export const appConfig = {
  host: process.env.APP_HOST || 'lor0138.lorenzetti.ibe',
  port: parseInt(process.env.APP_PORT || '3000', 10),
  url: process.env.APP_URL || 'http://lor0138.lorenzetti.ibe:3000',

  // Garantir que NUNCA seja localhost
  get baseUrl(): string {
    if (this.url.includes('localhost')) {
      throw new Error('ERRO: localhost não é permitido. Use lor0138.lorenzetti.ibe');
    }
    return this.url;
  },
};