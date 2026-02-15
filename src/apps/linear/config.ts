import { z } from 'zod';

/**
 * Validation schema for Linear plugin configuration.
 */
const linearConfigSchema = z.object({
  apiKey: z
    .string()
    .min(1, 'LINEAR_API_KEY is required for the Linear plugin'),
});

export type LinearConfig = z.infer<typeof linearConfigSchema>;

/**
 * Validate and return Linear plugin configuration.
 * Throws if LINEAR_API_KEY is not set.
 */
export function getLinearConfig(): LinearConfig {
  const result = linearConfigSchema.safeParse({
    apiKey: process.env.LINEAR_API_KEY,
  });

  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(', ');
    throw new Error(`Linear config validation failed: ${messages}`);
  }

  return result.data;
}
