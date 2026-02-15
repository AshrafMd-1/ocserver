import { LinearClient } from '@linear/sdk';
import { ApiError } from '../../core/errors';
import { logger } from '../../utils/logger';
import type { LinearIssue } from './types';

/** Singleton Linear client instance */
let client: LinearClient | null = null;

/**
 * Initialize the Linear SDK client with the given API key.
 */
export function initializeLinearClient(apiKey: string): void {
  client = new LinearClient({ apiKey });
  logger.debug('Linear client initialized');
}

/**
 * Get the initialized Linear client.
 * Throws if client has not been initialized.
 */
export function getLinearClient(): LinearClient {
  if (!client) {
    throw new ApiError('Linear client not initialized', 500);
  }
  return client;
}

/**
 * Fetch all issues assigned to the authenticated user.
 * Returns a sanitized array of LinearIssue objects.
 */
export async function fetchMyIssues(): Promise<LinearIssue[]> {
  try {
    const linearClient = getLinearClient();
    const me = await linearClient.viewer;
    const assignedIssues = await me.assignedIssues();

    const issues: LinearIssue[] = [];

    for (const issue of assignedIssues.nodes) {
      const [state, assignee, team, labels] = await Promise.all([
        issue.state,
        issue.assignee,
        issue.team,
        issue.labels(),
      ]);

      // Skip completed, canceled, duplicate, and resolved issues (only show active work)
      const excludedTypes = ['completed', 'canceled'];
      const excludedNames = ['Done', 'Cancelled', 'Canceled', 'Duplicate', 'Resolved'];

      if (state && (
        excludedTypes.includes(state.type) ||
        excludedNames.includes(state.name)
      )) {
        continue;
      }

      issues.push({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description ?? undefined,
        priority: issue.priority,
        priorityLabel: issue.priorityLabel,
        state: state
          ? {
              id: state.id,
              name: state.name,
              color: state.color,
              type: state.type,
            }
          : null,
        assignee: assignee
          ? {
              id: assignee.id,
              name: assignee.name,
              email: assignee.email,
            }
          : null,
        team: team
          ? {
              id: team.id,
              name: team.name,
              key: team.key,
            }
          : null,
        labels: labels.nodes.map((label) => ({
          id: label.id,
          name: label.name,
          color: label.color,
        })),
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
        url: issue.url,
      });
    }

    return issues;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    logger.error('Linear API error details:', err);
    throw new ApiError(
      'Failed to fetch issues from Linear',
      502,
      err instanceof Error ? err : new Error(String(err)),
    );
  }
}
