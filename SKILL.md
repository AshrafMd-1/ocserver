---
name: linear-proxy
description: REST API for Linear.app with smart issue filtering. Provides read-only access to active Linear issues. Use when you need to fetch active tasks, issues, or ticket details from Linear.
---

# Linear Proxy API

Direct REST API access to Linear.app with automatic filtering of completed work. Returns only active issues.

## Base URL

```
http://localhost:3000
```

## Endpoints

### Get All Your Active Issues

**Use this to:** See all issues currently assigned to you that are not completed or canceled.

```
GET /linear/my-issues
```

**Returns:** List of active issues with full details (title, description, state, priority, labels, etc.)

**Example:**
```bash
curl http://localhost:3000/linear/my-issues
```

**Response:**
```json
{
  "app": "linear",
  "path": "my-issues",
  "data": {
    "issues": [
      {
        "identifier": "PROJ-123",
        "title": "Issue title",
        "description": "Optional description",
        "priority": 1,
        "priorityLabel": "High",
        "state": {
          "name": "In Progress",
          "color": "#f2c94c",
          "type": "started"
        },
        "assignee": {
          "name": "User Name",
          "email": "user@example.com"
        },
        "team": {
          "name": "Team Name",
          "key": "PROJ"
        },
        "labels": [
          {
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

**Automatic Filtering:**
- Excludes completed issues
- Excludes canceled issues
- Excludes states: Done, Cancelled, Canceled, Duplicate, Resolved

---

### Get Specific Issue Details

**Use this to:** Get complete details for a specific issue including full description and all comments.

```
GET /linear/issue/{identifier}
```

**Parameters:**
- `{identifier}`: Issue ID (e.g., `PROJ-123`, `GOV-619`)

**Example:**
```bash
curl http://localhost:3000/linear/issue/PROJ-123
```

**Response:**
```json
{
  "app": "linear",
  "path": "issue",
  "data": {
    "issue": {
      "identifier": "PROJ-123",
      "title": "Issue title",
      "description": "Full markdown description...",
      "priority": 1,
      "priorityLabel": "High",
      "state": {
        "name": "In Progress",
        "color": "#f2c94c",
        "type": "started"
      },
      "assignee": {
        "name": "User Name",
        "email": "user@example.com"
      },
      "team": {
        "name": "Team Name",
        "key": "PROJ"
      },
      "labels": [
        {
          "name": "bug",
          "color": "#e5484d"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z",
      "url": "https://linear.app/workspace/issue/PROJ-123"
    },
    "comments": [
      {
        "body": "Comment text in markdown...",
        "user": {
          "name": "Commenter Name",
          "email": "commenter@example.com"
        },
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "commentCount": 5
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Quick Reference

### Priority Values
- `0`: No priority
- `1`: Urgent
- `2`: High
- `3`: Medium
- `4`: Low

### State Types
- `unstarted`: Not started (To Do, Backlog)
- `started`: In progress (In Progress, In Review)
- `completed`: ❌ Filtered out automatically
- `canceled`: ❌ Filtered out automatically

### Error Responses

All errors return JSON:
```json
{
  "error": "Error message",
  "statusCode": 404,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Agent Usage Tips

1. **Start with `/linear/my-issues`** to see all active work
2. **Use `/linear/issue/{identifier}`** when you need full details or comments
3. **No authentication needed** - API key is pre-configured
4. **All timestamps are UTC** in ISO 8601 format
5. **Read-only API** - Does not modify Linear data
6. **Filtering is automatic** - Only active issues are returned
