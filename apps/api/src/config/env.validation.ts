import * as Joi from 'joi';

function validateProductionOrigins(value: string, helpers: Joi.CustomHelpers) {
  const origins = value.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (!origins.length || origins.includes('*')) return helpers.error('any.invalid');

  for (const origin of origins) {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol !== 'https:' || parsed.origin !== origin) return helpers.error('any.invalid');
    } catch {
      return helpers.error('any.invalid');
    }
  }

  return value;
}

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().port().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().min(1).required(),
  POSTGRES_DB: Joi.string().required(),
  AUTH_TOKEN_SECRET: Joi.string().min(32).required(),
  RESIDENT_APP_TOKEN_SECRET: Joi.string().min(32).required(),
  MFA_ENCRYPTION_KEY: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().pattern(/^[0-9a-f]{64}$/i).required(),
    otherwise: Joi.string().pattern(/^[0-9a-f]{64}$/i).optional(),
  }),
  CORS_ORIGINS: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required().custom(validateProductionOrigins, 'HTTPS origin allowlist'),
    otherwise: Joi.string().optional(),
  }),
  RESIDENT_APP_URL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().uri({ scheme: ['https'] }).required(),
    otherwise: Joi.string().optional(),
  }),
  GCS_FINANCE_EVIDENCE_BUCKET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(3).required(),
    otherwise: Joi.string().optional(),
  }),
  PORT: Joi.number().port(),
  API_PORT: Joi.number().port(),
}).unknown(true);