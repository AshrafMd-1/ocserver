import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import type { AppPlugin, AppRegistry, PathHandler } from './types';

/**
 * Plugin registry that handles discovery, registration, and lookup.
 * Supports auto-discovery of plugins in /src/apps/* directories
 * and lazy initialization on first access.
 */
class PluginRegistry implements AppRegistry {
  private plugins: Map<string, AppPlugin> = new Map();
  private initialized: Set<string> = new Set();

  /**
   * Register a plugin with the registry.
   * Does not initialize it -- initialization is deferred to first access.
   */
  registerPlugin(plugin: AppPlugin): void {
    if (this.plugins.has(plugin.name)) {
      logger.warn(`Plugin "${plugin.name}" is already registered, skipping`);
      return;
    }
    this.plugins.set(plugin.name, plugin);
    logger.info(
      `Registered plugin: ${plugin.name} v${plugin.version} (${plugin.paths.length} paths)`,
    );
  }

  /**
   * Get a plugin by name.
   * Lazily initializes the plugin on first access.
   */
  async getPlugin(name: string): Promise<AppPlugin | undefined> {
    const plugin = this.plugins.get(name);
    if (!plugin) return undefined;

    if (!this.initialized.has(name)) {
      logger.info(`Initializing plugin: ${name}`);
      await plugin.initialize();
      this.initialized.add(name);
      logger.info(`Plugin initialized: ${name}`);
    }

    return plugin;
  }

  /** Get names of all registered plugins */
  getAllPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /** Get path handlers for a specific plugin (without initializing) */
  getPluginPaths(name: string): PathHandler[] | undefined {
    return this.plugins.get(name)?.paths;
  }

  /**
   * Auto-discover and register plugins from /src/apps directories.
   * Each plugin directory must have an index.ts/index.js that exports
   * a variable matching `*Plugin` (e.g., `linearPlugin`).
   */
  async discoverPlugins(appsDir: string): Promise<void> {
    if (!fs.existsSync(appsDir)) {
      logger.warn(`Apps directory not found: ${appsDir}`);
      return;
    }

    const entries = fs.readdirSync(appsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const pluginIndexTs = path.join(appsDir, entry.name, 'index.ts');
      const pluginIndexJs = path.join(appsDir, entry.name, 'index.js');
      const pluginPath = fs.existsSync(pluginIndexTs)
        ? pluginIndexTs
        : fs.existsSync(pluginIndexJs)
          ? pluginIndexJs
          : null;

      if (!pluginPath) {
        logger.debug(`No index file found in ${entry.name}, skipping`);
        continue;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pluginModule = require(pluginPath);
        const pluginExport = Object.keys(pluginModule).find((key) =>
          key.endsWith('Plugin'),
        );

        if (pluginExport && pluginModule[pluginExport]) {
          const plugin = pluginModule[pluginExport] as AppPlugin;
          this.registerPlugin(plugin);
        } else {
          logger.warn(
            `No *Plugin export found in ${entry.name}/index, skipping`,
          );
        }
      } catch (err) {
        logger.error(`Failed to load plugin from ${entry.name}: ${err}`);
      }
    }
  }
}

/** Singleton plugin registry instance */
export const registry = new PluginRegistry();
