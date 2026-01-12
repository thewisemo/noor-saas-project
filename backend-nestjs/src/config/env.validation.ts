import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
  JWT_SECRET: Joi.string().min(32).required(),
  NOOR_MASTER_KEY: Joi.string().required(),
  TYPEORM_SYNC: Joi.string().valid('true', 'false').default('false'),
  ALLOW_DEFAULT_SUPER_ADMIN_SEED: Joi.string().valid('true', 'false').default('false'),
  SMS_PROVIDER_BASE_URL: Joi.string().uri({ scheme: [/https?/] }).optional(),
  SMS_PROVIDER_API_KEY: Joi.string().optional(),
  SMS_PROVIDER_SENDER_ID: Joi.string().optional(),
  OPENAI_API_KEY: Joi.string().optional(),
  OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),
  WHATSAPP_VERIFY_TOKEN: Joi.string().required(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().optional(),
  WHATSAPP_ACCESS_TOKEN: Joi.string().optional(),
  REDIS_URL: Joi.string().optional(),
  OTP_LENGTH: Joi.number().valid(6).default(6),
  OTP_EXPIRY_MINUTES: Joi.number().integer().min(1).default(5),
  OTP_MAX_ATTEMPTS: Joi.number().integer().min(1).default(3),
  ENABLE_DEBUG_LOGS: Joi.boolean().truthy('true').falsy('false').default(false),
}).unknown(true);
