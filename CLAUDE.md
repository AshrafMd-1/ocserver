# OpenClaw Proxy Server - Development Notes

This document captures all architectural decisions, learnings, and important context for future development.

## Project Overview

**Purpose:** Plugin-based REST API proxy server that provides unified access to multiple productivity tools (Linear, GitHub, Jira, etc.) for OpenClaw agents.

**Current Status:** Production-ready with Linear integration (2 endpoints)

**Key Feature:** Smart issue filtering - automatically excludes completed work to show only active issues.

## Architecture Decisions

### 1. Plugin-Based Architecture

**Decision:** Self-contained plugins that auto-register without core code changes.

**Why:**
- Adding new apps (GitHub, Jira) requires zero changes to core router/registry
- Each app is completely isolated and portable
- Convention over configuration

**How it works:**
- Plugins live in `src/apps/{name}/`
- Must export `{name}Plugin: AppPlugin` from `index.ts`
- Registry auto-discovers by scanning directory

### 2. Dynamic Routing with Express Route Patterns

**Decision:** Register each path handler as an actual Express route instead of generic `/:app/:path` matching.

**Evolution:**
- **Initial approach:** Single `/:app/:path` route that looked up handlers by name
- **Problem:** Couldn't handle dynamic parameters like `/linear/issue/:identifier`
- **Solution:** Register each path with its full Express pattern: `/${app}/${pathHandler.name}`

**Key insight:** Path names can include Express patterns (e.g., `issue/:identifier`), and Express will handle parameter extraction.

### 3. Linear SDK Over Raw GraphQL

**Decision:** Use `@linear/sdk` instead of raw GraphQL queries.

**Why:**
- Type-safe API with TypeScript definitions
- Automatic query optimization
- Maintained by Linear (stays up-to-date)
- Built-in error handling

**Gotcha encountered:** The SDK's `orderBy` parameter doesn't accept objects like `{ updatedAt: 'desc' }`. Solution: Removed orderBy entirely (issues are already sorted by default).

### 4. Environment Loading with dotenv

**Critical fix:** Must explicitly call `dotenv.config({ path: ... })` at the top of `src/config/index.ts`.

**Why:** The `tsx` dev server doesn't automatically load `.env` files like some tools do.

**Solution:**
```typescript
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
```

## Issues Encountered & Solutions

### Issue 1: Registry Bug - `Set.set()` vs `Set.add()`

**Error:** `Property 'set' does not exist on type 'Set<string>'`

**Root cause:** Sets use `.add()` method, not `.set()`. Maps use `.set()`.

**Location:** `src/core/registry.ts:41`

**Fix:** Changed `this.initialized.set(name)` → `this.initialized.add(name)`

### Issue 2: Missing Dependencies

**Missing:** `dotenv`, `ts-node`

**Why:** Not included in initial package.json

**Fix:**
```bash
npm install dotenv
npm install --save-dev ts-node
```

### Issue 3: Invalid Linear SDK Usage

**Error:** `Variable "$orderBy" got invalid value { updatedAt: "desc" }`

**Root cause:** Linear SDK expects orderBy as enum string, not object

**Location:** `src/apps/linear/client.ts:36-37`

**Fix:** Removed orderBy parameter entirely (default sorting is sufficient)

### Issue 4: Dynamic Route 404s

**Problem:** `/linear/issue/GOV-619` returned 404 even though endpoint was registered

**Root cause:** Old router used generic `/:app/:path` pattern which doesn't match three segments

**Solution:** Changed router to register specific routes for each handler:
```typescript
// Old: router.get('/:app/:path', handler)
// New: router.get('/linear/issue/:identifier', handler)
```

### Issue 5: Test Failures After Router Change

**Problem:** Tests for unknown apps/paths started failing

**Root cause:** New router doesn't have catch-all for unmatched routes

**Solution:** Added catch-all route at end of router:
```typescript
router.use('/:app/*?', (req, res, next) => {
  // Check if app exists, return appropriate 404
});
```

### Issue 6: TypeScript "Not all code paths return a value"

**Error:** Handler function didn't explicitly return void

**Location:** `src/apps/linear/paths/issue-detail.ts:13`

**Fix:** Added explicit `Promise<void>` return type and `return;` after early exits

## File Structure & Responsibilities

```
src/
├── config/
│   ├── env.schema.ts       # Zod schemas for environment validation
│   └── index.ts            # ⚠️ MUST load dotenv here!
├── core/
│   ├── types.ts            # AppPlugin, PathHandler interfaces
│   ├── registry.ts         # Plugin discovery & lazy initialization
│   ├── router.ts           # Dynamic route registration with Express
│   └── errors.ts           # Custom error hierarchy
├── apps/
│   └── linear/
│       ├── index.ts        # Plugin registration & initialization
│       ├── config.ts       # LINEAR_API_KEY validation
│       ├── client.ts       # SDK wrapper with error handling
│       ├── types.ts        # TypeScript interfaces for Linear data
│       └── paths/
│           ├── index.ts           # Path registry export
│           ├── my-issues.ts       # GET /linear/my-issues
│           └── issue-detail.ts    # GET /linear/issue/:identifier
└── middleware/
    ├── errorHandler.ts     # Global error handling
    └── logger.ts           # Request logging
```

## Critical Implementation Details

### 1. Issue Filtering Logic

**Location:** `src/apps/linear/client.ts:47-53`

**Filter excludes:**
- State types: `completed`, `canceled`
- State names: `Done`, `Cancelled`, `Canceled`, `Duplicate`, `Resolved`

**Why both?** Linear uses `type` for workflow state, but custom workflows can have different names.

### 2. Plugin Initialization

**Pattern:** Lazy initialization on first access

**Why:** Fast server startup - plugins initialize only when first used

**Implementation:** Registry tracks initialized plugins in a `Set<string>`

### 3. Error Handling Strategy

**Three-tier errors:**
1. `AppError` - General application errors (404, validation)
2. `PluginError` - Plugin-specific errors (wraps AppError with plugin context)
3. `ApiError` - External API errors (Linear SDK failures)

**All errors include:**
- `statusCode` - HTTP status
- `message` - User-facing message
- Sanitized output (no stack traces in production)

### 4. Response Format Standard

**All endpoints return:**
```json
{
  "app": "string",
  "path": "string",
  "data": { ... },
  "timestamp": "ISO 8601 UTC"
}
```

**Errors return:**
```json
{
  "error": "string",
  "statusCode": number,
  "timestamp": "ISO 8601 UTC"
}
```

## Testing Strategy

### Unit Tests (`tests/unit/`)

- Test individual functions in isolation
- Mock external dependencies (Linear SDK)
- Focus on business logic

**Example:** `apps/linear/client.test.ts` - Tests Linear client methods with mocked SDK

### Integration Tests (`tests/integration/`)

- Test full request/response cycle
- Use supertest to simulate HTTP requests
- Test error handling and edge cases

**Example:** `routes/linear.test.ts` - Tests all routes with mock plugin

## Development Workflow

### Adding a New Path to Linear

1. Create handler: `src/apps/linear/paths/new-path.ts`
2. Export from: `src/apps/linear/paths/index.ts`
3. Update: `src/apps/linear/client.ts` (if new SDK calls needed)
4. Update: `SKILL.md` with endpoint documentation
5. Run: `npm test` to verify

**No changes needed to:**
- Core router ✓
- Server setup ✓
- Registry ✓

### Adding a New App (e.g., GitHub)

1. Create directory: `src/apps/github/`
2. Copy structure from `src/apps/linear/`
3. Implement:
   - `index.ts` - Plugin export
   - `config.ts` - API key validation
   - `client.ts` - SDK wrapper
   - `paths/` - Endpoint handlers
4. Add env var: `GITHUB_TOKEN` to `.env` and `.env.example`
5. Install SDK: `npm install octokit`

**Auto-discovered - no registration needed!**

## Important Learnings

### 1. TypeScript Strict Mode Benefits

- Caught the `Set.set()` vs `Set.add()` bug at compile time
- Prevented incorrect orderBy usage (would have been runtime error)
- Enforced proper error handling return types

### 2. Express Route Registration Order Matters

- Specific routes must be registered before catch-all routes
- Catch-all `/:app/*?` must be last

### 3. Linear SDK Quirks

- `orderBy` parameter is enum, not object
- Issue queries return paginated results (`nodes` array)
- State type vs state name distinction
- Comments require separate query

### 4. dotenv Must Be Explicit

- `import 'dotenv/config'` doesn't work reliably with `tsx`
- Must use explicit `dotenv.config({ path: ... })`

### 5. Plugin Pattern Success

- Zero coupling between apps and core
- Added second endpoint (issue detail) with no router changes
- Future apps can be added without touching existing code

## Performance Considerations

### Current Implementation

- **Lazy plugin initialization** - Fast startup
- **Parallel API calls** - Uses `Promise.all()` for issue fields
- **No caching** - Every request hits Linear API

### Future Optimizations (if needed)

1. **Response caching** - Redis for frequently accessed issues
2. **Request batching** - Combine multiple issue requests
3. **Pagination** - Currently returns all issues (6 active)
4. **Rate limiting** - Protect against DoS

## Security Notes

### Current Security

- ✅ API keys validated at startup
- ✅ Environment variables never exposed in errors
- ✅ No SQL injection risk (using SDK)
- ✅ Error stack traces hidden in production
- ✅ Input validation with Zod schemas

### Production Checklist

- [ ] Add rate limiting (express-rate-limit)
- [ ] Configure CORS for OpenClaw origin
- [ ] Add Helmet.js for security headers
- [ ] Implement API key rotation strategy
- [ ] Add request authentication (if needed)

## Known Limitations

1. **Read-only API** - No write operations (create/update issues)
2. **Single user context** - Uses one Linear API key for all requests
3. **No pagination** - Returns all results (currently 6 issues)
4. **No webhooks** - Polling only, no real-time updates
5. **Linear only** - Other apps (GitHub, Jira) not yet implemented

## Future Enhancements

### High Priority

1. **Add more Linear endpoints:**
   - Create issue
   - Update issue
   - Add comment
   - List projects/teams

2. **Add GitHub integration:**
   - List repositories
   - List pull requests
   - PR details with reviews

3. **Add Jira integration:**
   - List issues
   - Issue details
   - Update status

### Medium Priority

1. **Response caching** - Reduce Linear API calls
2. **Webhook support** - Real-time updates
3. **Pagination** - Handle large result sets
4. **Search/filter** - Query parameters for filtering

### Low Priority

1. **OpenAPI/Swagger docs** - Auto-generated API docs
2. **GraphQL endpoint** - Alternative to REST
3. **Metrics/monitoring** - Prometheus exporters
4. **Multi-user support** - User-specific API keys

## Debugging Tips

### Server won't start

1. Check `.env` file exists with `LINEAR_API_KEY`
2. Verify port 3000 is available: `lsof -ti :3000`
3. Check logs for dotenv loading message

### Endpoint returns 404

1. Check plugin is registered: `GET /items`
2. Check path is registered: `GET /list/linear`
3. Verify route pattern matches request
4. Check server logs for route registration

### Tests failing

1. Verify all dependencies installed: `npm install`
2. Check TypeScript compiles: `npm run build`
3. Look for changed router patterns
4. Verify mock plugin structure matches real plugins

### Linear API errors

1. Verify API key is valid
2. Check Linear SDK version compatibility
3. Look for API schema changes
4. Review Linear SDK error messages in logs

## Environment Variables

```bash
# Required
LINEAR_API_KEY=lin_api_...    # Get from Linear Settings → API Keys

# Optional
PORT=3000                      # Server port (default: 3000)
NODE_ENV=development           # Environment (development|production)
LOG_LEVEL=info                 # Log level (error|warn|info|debug)
```

## Quick Reference

### Start Development

```bash
npm run dev
```

### Run Tests

```bash
npm test
npm run test:coverage
```

### Build for Production

```bash
npm run build
npm start
```

### Test Endpoints

```bash
# List apps
curl http://localhost:3000/items

# List Linear paths
curl http://localhost:3000/list/linear

# Get active issues
curl http://localhost:3000/linear/my-issues

# Get issue details
curl http://localhost:3000/linear/issue/PROJ-123
```

## Contact & Resources

- **Linear API Docs:** https://developers.linear.app/docs/graphql/working-with-the-graphql-api
- **Linear SDK:** https://github.com/linear/linear/tree/master/packages/sdk
- **Express Routing:** https://expressjs.com/en/guide/routing.html

---

**Last Updated:** 2026-02-15
**Version:** 1.0.0
**Status:** Production Ready ✅
