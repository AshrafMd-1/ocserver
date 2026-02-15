/**
 * Base application error with HTTP status code support.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error originating from a plugin (app integration).
 * Carries the plugin name for context in error responses.
 */
export class PluginError extends AppError {
  public readonly pluginName: string;

  constructor(pluginName: string, message: string, statusCode = 500) {
    super(message, statusCode);
    this.name = 'PluginError';
    this.pluginName = pluginName;
  }
}

/**
 * Error from an external API call (e.g., Linear API).
 * Wraps the original error for debugging while providing
 * a sanitized message for client responses.
 */
export class ApiError extends AppError {
  public readonly originalError?: Error;

  constructor(message: string, statusCode = 502, originalError?: Error) {
    super(message, statusCode);
    this.name = 'ApiError';
    this.originalError = originalError;
  }
}
