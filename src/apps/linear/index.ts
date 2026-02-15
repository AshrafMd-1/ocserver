import type { AppPlugin } from '../../core/types';
import { getLinearConfig } from './config';
import { initializeLinearClient, getLinearClient } from './client';
import { linearPaths } from './paths';
import { logger } from '../../utils/logger';

/**
 * Linear app plugin.
 * Provides integration with Linear issue tracking via their official SDK.
 */
export const linearPlugin: AppPlugin = {
  name: 'linear',
  version: '1.0.0',
  description: 'Integration with Linear issue tracking',
  paths: linearPaths,

  async initialize(): Promise<void> {
    const config = getLinearConfig();
    initializeLinearClient(config.apiKey);
    logger.info('Linear plugin initialized successfully');
  },

  async healthCheck(): Promise<boolean> {
    try {
      const client = getLinearClient();
      const viewer = await client.viewer;
      return !!viewer.id;
    } catch {
      return false;
    }
  },
};
