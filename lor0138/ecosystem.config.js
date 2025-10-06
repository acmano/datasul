// ecosystem.config.js
// Configuração do PM2 para produção
//
// Este arquivo define como o PM2 gerencia a aplicação em produção.
// Para usar: pm2 start ecosystem.config.js
//
// Documentação: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [{
    // Identificação
    name: 'lor0138-backend',
    script: '/opt/lor0138/backend/current/dist/server.js',
    cwd: '/opt/lor0138/backend/current',
    
    // Modo de execução
    instances: 1,
    exec_mode: 'fork',
    
    // Variáveis de ambiente
    env: {
      // Servidor
      NODE_ENV: 'production',
      PORT: '3001',
      HOST: '0.0.0.0',
      APP_HOST: '0.0.0.0',
      APP_PORT: '3001',
      API_PREFIX: '/api',
      
      // Banco de dados
      DB_CONNECTION_TYPE: 'sqlserver',
      DB_SERVER: '10.105.0.4\\LOREN',
      DB_PORT: '1433',
      DB_USER: 'dcloren',
      DB_PASSWORD: '#dcloren#',
      DB_DATABASE_EMP: '',
      DB_DATABASE_MULT: '',
      
      // Timeouts (em milissegundos)
      DB_CONNECTION_TIMEOUT: '500000',
      DB_REQUEST_TIMEOUT: '30000',
      HTTP_REQUEST_TIMEOUT: '30000',
      HTTP_HEAVY_TIMEOUT: '60000',
      HTTP_HEALTH_TIMEOUT: '5000',
      
      // Cache
      CACHE_ENABLED: 'true',
      CACHE_STRATEGY: 'layered',
      CACHE_REDIS_URL: 'redis://localhost:6379',
      CACHE_DEFAULT_TTL: '300000',
      
      // CORS
      CORS_ALLOWED_ORIGINS: 'http://lor0138.lorenzetti.ibe:3001,http://localhost:3001',
      
      // Logs
      LOG_LEVEL: 'info',
      LOG_FILE: '/var/log/lor0138/app.log'
    },
    
    // Logs do PM2
    error_file: '/var/log/lor0138/pm2/lor0138-error.log',
    out_file: '/var/log/lor0138/pm2/lor0138-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    
    // Auto-restart
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    
    // Graceful reload
    kill_timeout: 10000,
    listen_timeout: 10000,
    wait_ready: true,
    
    // Watch (desabilitado em produção)
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git']
  }]
};
