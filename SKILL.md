# OpenClaw Proxy Server

REST API for Linear.app with smart issue filtering. Provides read-only access to active Linear issues.

## What This Skill Does

Fetches Linear issues assigned to the authenticated user, automatically filtering out completed work. Returns only issues that are actively in progress or pending.

## Base URL

```
http://localhost:3000
```

## Available Endpoints

### List Available Apps

```
GET /items
```

Returns all available integrations.

**Response:**
```json
{
  "apps": ["linear"],
  "count": 1
}
```

---

### List App Endpoints

```
GET /list/linear
```

Returns available endpoints for Linear.

**Response:**
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

---

### Get My Active Issues

```
GET /linear/my-issues
```

Returns only **active** issues assigned to you.

**Automatic Filtering:** Excludes issues with these states:
- State types: `completed`, `canceled`
- State names: `Done`, `Cancelled`, `Canceled`, `Duplicate`, `Resolved`

**Response Structure:**
```json
{
  "app": "linear",
  "path": "my-issues",
  "data": {
    "issues": [
      {
        "id": "uuid",
        "identifier": "PROJ-123",
        "title": "Issue title",
        "description": "Optional description",
        "priority": 1,
        "priorityLabel": "High",
        "state": {
          "id": "uuid",
          "name": "In Progress",
          "color": "#f2c94c",
          "type": "started"
        },
        "assignee": {
          "id": "uuid",
          "name": "User Name",
          "email": "user@example.com"
        },
        "team": {
          "id": "uuid",
          "name": "Team Name",
          "key": "PROJ"
        },
        "labels": [
          {
            "id": "uuid",
            "name": "bug",
            "color": "#e5484d"
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "url": "https://linear.app/workspace/issue/PROJ-123"
      }
    ],
    "count": 6
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Response Format

All endpoints return JSON.

**Success Response:**
```json
{
  "app": "string",
  "path": "string",
  "data": { ... },
  "timestamp": "ISO 8601 UTC"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "statusCode": 404,
  "timestamp": "ISO 8601 UTC"
}
```

---

## Field Reference

### Priority Values

- `0`: No priority
- `1`: Urgent
- `2`: High
- `3`: Medium
- `4`: Low

### State Types

- `unstarted`: Not started (e.g., "To Do", "Backlog")
- `started`: In progress (e.g., "In Progress", "In Review")
- `completed`: ❌ **Filtered out**
- `canceled`: ❌ **Filtered out**

### Timestamps

All timestamps are in UTC using ISO 8601 format:
```
"2024-01-01T12:00:00.000Z"
```

---

## Usage Notes

1. **Filtering is automatic** - No need to manually filter responses
2. **Issue count varies** - Reflects current Linear state
3. **All responses are JSON** - Parse before processing
4. **Read-only API** - Does not modify Linear data
5. **Authentication is pre-configured** - No tokens needed in requests
