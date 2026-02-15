import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

/**
 * A single path handler within a plugin.
 * Each path represents one endpoint the plugin exposes (e.g., "my-issues").
 */
export interface PathHandler {
  /** URL-safe path name (used in /:app/:path) */
  name: string;
  /** Human-readable description of what this path does */
  description: string;
  /** Express request handler that processes the request */
  handler: RequestHandler;
  /** Optional Zod schema for query/body parameter validation */
  schema?: ZodSchema;
}

/**
 * Plugin interface that all app integrations must implement.
 * Each plugin represents a third-party app (e.g., Linear, GitHub).
 */
export interface AppPlugin {
  /** Unique plugin identifier (used as :app in routes) */
  name: string;
  /** Semantic version string */
  version: string;
  /** Human-readable description */
  description: string;
  /** Array of path handlers this plugin exposes */
  paths: PathHandler[];
  /**
   * Initialize the plugin (e.g., validate API keys, create clients).
   * Called lazily on first access.
   */
  initialize(): Promise<void>;
  /**
   * Optional health check for the plugin's external dependency.
   * Returns true if the integration is operational.
   */
  healthCheck?(): Promise<boolean>;
}

/**
 * Registry interface for managing plugins.
 */
export interface AppRegistry {
  /** Register a plugin with the registry */
  registerPlugin(plugin: AppPlugin): void;
  /** Get a plugin by name, initializing it if needed */
  getPlugin(name: string): Promise<AppPlugin | undefined>;
  /** Get all registered plugin names */
  getAllPlugins(): string[];
  /** Get all path handlers for a specific plugin */
  getPluginPaths(name: string): PathHandler[] | undefined;
}
