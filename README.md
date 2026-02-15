# OpenClaw Proxy Server (ocserver)

A plugin-based Node.js proxy server that provides a unified REST API for OpenClaw to interact with multiple third-party applications. Currently supports Linear issue tracking.

## Architecture

```
ocserver/
  src/
    apps/           # Plugin integrations (one directory per app)
      linear/       # Linear issue tracking plugin
    config/         # Environment config with Zod validation
    core/           # Plugin system (types, registry, router, errors)
    middleware/     # Express middleware (logging, error handling)
    utils/          # Shared utilities (Winston logger)
    server.ts       # Express app assembly
    index.ts        # Server entry point
  tests/
    unit/           # Unit tests
    integration/    # Integration tests
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `LOG_LEVEL` | No | `info` | Log level (error, warn, info, http, debug) |
| `LINEAR_API_KEY` | Yes* | - | Linear API key (* required for Linear plugin) |

### Running

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

### Testing

```bash
npm test
npm run test:coverage
```

## API Endpoints

### List All Apps

```
GET /items
```

Response:
```json
{
  "apps": ["linear"],
  "count": 1
}
```

### List App Paths

```
GET /list/:app
```

Example: `GET /list/linear`

Response:
```json
{
  "app": "linear",
  "paths": [
    {
      "name": "my-issues",
      "description": "Fetch all issues assigned to the authenticated user"
    }
  ],
  "count": 1
}
```

### Execute Path Handler

```
GET /:app/:path
```

Example: `GET /linear/my-issues`

**Filtering:** Returns only active issues assigned to you. Excludes:
- State types: `completed`, `canceled`
- State names: `Done`, `Cancelled`, `Canceled`, `Duplicate`, `Resolved`

Response:
```json
{
  "app": "linear",
  "path": "my-issues",
  "data": {
    "issues": [
      {
        "id": "...",
        "identifier": "PROJ-123",
        "title": "Issue title",
        "state": {
          "name": "In Progress",
          "type": "started",
          "color": "#f2c94c"
        },
        "priority": 1,
        "priorityLabel": "High",
        "assignee": { "name": "User", "email": "user@example.com" },
        "team": { "name": "Team", "key": "PROJ" },
        "labels": [{ "name": "bug", "color": "#e5484d" }],
        "url": "https://linear.app/...",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 5
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "uptime": 123.456,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "app": "linear",
  "path": "my-issues",
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Adding a New App Plugin

The plugin system is fully modular. Adding a new app requires **zero changes to core code**.

### 1. Create the Plugin Directory

```
src/apps/your-app/
  types.ts        # TypeScript types for your data
  config.ts       # Config validation (API keys, etc.)
  client.ts       # API client wrapper
  paths/
    index.ts      # Export all path handlers
    my-path.ts    # Individual path handler
  index.ts        # Plugin registration
```

### 2. Implement the Plugin Interface

```typescript
// src/apps/your-app/index.ts
import type { AppPlugin } from '../../core/types';
import { yourPaths } from './paths';

export const yourAppPlugin: AppPlugin = {
  name: 'your-app',
  version: '1.0.0',
  description: 'Integration with Your App',
  paths: yourPaths,

  async initialize() {
    // Validate config, create API client, etc.
  },

  async healthCheck() {
    // Optional: verify external API is reachable
    return true;
  },
};
```

### 3. Create Path Handlers

```typescript
// src/apps/your-app/paths/my-path.ts
import type { PathHandler } from '../../../core/types';

const myPathHandler: PathHandler = {
  name: 'my-path',
  description: 'Description of what this does',
  handler: async (req, res) => {
    const data = await fetchSomething();
    res.json({
      app: 'your-app',
      path: 'my-path',
      data,
      timestamp: new Date().toISOString(),
    });
  },
};

export default myPathHandler;
```

The plugin will be **auto-discovered** on server startup. No registration code needed.

## License

ISC
