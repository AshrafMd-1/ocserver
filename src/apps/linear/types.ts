/**
 * TypeScript types for Linear data structures.
 * These represent the sanitized shapes returned by our API,
 * not the raw Linear SDK types.
 */

/** Simplified Linear issue representation */
export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number;
  priorityLabel: string;
  state: {
    id: string;
    name: string;
    color: string;
    type: string;
  } | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  team: {
    id: string;
    name: string;
    key: string;
  } | null;
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  createdAt: string;
  updatedAt: string;
  url: string;
}

/** Response shape for the my-issues path */
export interface MyIssuesResponse {
  issues: LinearIssue[];
  count: number;
}
