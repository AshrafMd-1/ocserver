import { z } from 'zod';

/**
 * Schema for environment variable validation.
 * All environment variables are validated at startup to fail fast
 * if required configuration is missing.
 */
export const envSchema = z.object({
  /** Server port number */
  PORT: z
    .string()
    .default('3000')
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535)),

  /** Node environment */
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  /** Winston log level */
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info'),

  /** Linear API key for Linear integration */
  LINEAR_API_KEY: z.string().optional(),
});

/** Validated environment configuration type */
export type EnvConfig = z.infer<typeof envSchema>;
