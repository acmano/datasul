/**
 * Security Configuration
 */
export const securityConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'change-in-production',
    expiresIn: '1h',
    refreshExpiresIn: '7d',
  },
  cors: {
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    maxAge: 86400,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },
  validation: {
    maxBodySize: '10mb',
    parameterPollution: false,
    xss: true,
    sqlInjection: true,
  },
};
