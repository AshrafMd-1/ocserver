# OpenClaw Proxy Server

A plugin-based Node.js proxy server that gives OpenClaw agents a unified REST API to interact with productivity tools. Drop a new plugin directory in `src/apps/` and it's live — no changes to core code required.

**Current integrations:** Linear

## How It Works

```
Request → Express → Dynamic Router → Plugin Registry → Path Handler → External API
```

Plugins are auto-discovered at startup by scanning `src/apps/*/index.ts` for a `*Plugin` export. Each plugin initializes lazily on its first request. Routes are registered as real Express patterns, so handlers can define dynamic segments like `issue/:identifier`.

## Project Structure

```
src/
├── core/
│   ├── types.ts          # AppPlugin and PathHandler interfaces
│   ├── registry.ts       # Auto-discovery, registration, lazy init
│   ├── router.ts         # Dynamic Express route registration
│   └── errors.ts         # AppError / PluginError / ApiError hierarchy
├── config/
│   ├── env.schema.ts     # Zod environment schemas
│   └── index.ts          # Loads dotenv, exports validated config
├── apps/
│   └── linear/
│       ├── index.ts      # Plugin export (linearPlugin)
│       ├── config.ts     # LINEAR_API_KEY validation
│       ├── client.ts     # Linear SDK wrapper
│       ├── types.ts      # TypeScript interfaces
│       └── paths/
│           ├── index.ts          # Re-exports all handlers
│           ├── my-issues.ts      # GET /linear/my-issues
│           └── issue-detail.ts   # GET /linear/issue/:identifier
├── middleware/
│   ├── logger.ts         # HTTP request logging
│   └── errorHandler.ts   # Global error → JSON response
├── utils/
│   └── logger.ts         # Winston logger
├── server.ts             # Express app assembly
└── index.ts              # Entry point
tests/
├── unit/apps/linear/     # Linear client unit tests (mocked SDK)
└── integration/routes/   # Full HTTP cycle tests (supertest)
```

## Quick Start

**Prerequisites:** Node.js 18+

```bash
npm install
cp .env.example .env   # then fill in LINEAR_API_KEY
npm run dev            # starts with hot reload on port 3000
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LINEAR_API_KEY` | Yes* | — | Linear API key (* required for Linear plugin) |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `LOG_LEVEL` | No | `info` | `error` `warn` `info` `http` `debug` |

Get a Linear API key at **Linear → Settings → API → Personal API keys**.

### Commands

```bash
npm run dev            # development with hot reload
npm run build          # compile TypeScript → dist/
npm start              # run compiled build
npm test               # run all tests
npm run test:coverage  # tests with coverage report
```

## API Reference

### System

```
GET /health            → { status, uptime, timestamp }
GET /items             → { apps: ["linear"], count: 1 }
GET /list/:app         → { app, paths: [{ name, description }], count }
```

### Linear

#### `GET /linear/my-issues`

Returns all active issues assigned to the authenticated user. Automatically excludes completed and canceled work.

**Filtered out:** state types `completed` / `canceled`, state names `Done`, `Cancelled`, `Canceled`, `Duplicate`, `Resolved`

```bash
curl http://localhost:3000/linear/my-issues
```

```json
{
  "app": "linear",
  "path": "my-issues",
  "data": {
    "issues": [
      {
        "identifier": "PROJ-123",
        "title": "Issue title",
        "description": "Optional markdown description",
        "priority": 2,
        "priorityLabel": "High",
        "state": { "name": "In Progress", "type": "started", "color": "#f2c94c" },
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

#### `GET /linear/issue/:identifier`

Returns full details for a single issue including description and all comments.

```bash
curl http://localhost:3000/linear/issue/PROJ-123
```

```json
{
  "app": "linear",
  "path": "issue",
  "data": {
    "issue": { "...same fields as above..." },
    "comments": [
      {
        "body": "Comment text in markdown",
        "user": { "name": "Commenter", "email": "user@example.com" },
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "commentCount": 3
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Priority values:** `0` = None, `1` = Urgent, `2` = High, `3` = Medium, `4` = Low

### Error Format

All errors return a consistent JSON body:

```json
{
  "error": "App \"github\" not found",
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Adding a Plugin

Zero changes to core code. Create `src/apps/your-app/` with this structure:

```typescript
// src/apps/your-app/index.ts
import type { AppPlugin } from '../../core/types';

export const yourAppPlugin: AppPlugin = {
  name: 'your-app',
  version: '1.0.0',
  description: 'Integration with Your App',
  paths: [
    {
      name: 'my-path',
      description: 'What this endpoint returns',
      handler: async (req, res) => {
        res.json({
          app: 'your-app',
          path: 'my-path',
          data: { /* ... */ },
          timestamp: new Date().toISOString(),
        });
      },
    },
  ],
  async initialize() {
    // Validate API keys, create clients, etc.
  },
};
```

The server discovers and registers it automatically on next startup. The route `GET /your-app/my-path` is live immediately.

For dynamic path segments, set `name: 'item/:id'` — Express handles parameter extraction via `req.params`.

## Adding a Path to an Existing Plugin

1. Create `src/apps/linear/paths/new-path.ts` implementing `PathHandler`
2. Export it from `src/apps/linear/paths/index.ts`
3. Add any needed SDK calls to `client.ts`
4. Run `npm test`

No changes to router, registry, or server setup.
