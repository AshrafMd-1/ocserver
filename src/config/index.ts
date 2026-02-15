import * as dotenv from 'dotenv';
import * as path from 'path';
import { envSchema, type EnvConfig } from './env.schema';

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Parse and validate environment variables using Zod schema.
 * Throws a descriptive error at startup if validation fails.
 */
function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return result.data;
}

/** Validated, type-safe configuration object */
export const config = loadConfig();

export type { EnvConfig };
