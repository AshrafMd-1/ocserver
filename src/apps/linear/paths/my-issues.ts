import type { Request, Response } from 'express';
import type { PathHandler } from '../../../core/types';
import { fetchMyIssues } from '../client';

/**
 * Handler for GET /linear/my-issues
 * Fetches all issues assigned to the authenticated Linear user.
 */
const myIssuesHandler: PathHandler = {
  name: 'my-issues',
  description: 'Fetch all issues assigned to the authenticated user',
  handler: async (_req: Request, res: Response) => {
    const issues = await fetchMyIssues();

    res.json({
      app: 'linear',
      path: 'my-issues',
      data: {
        issues,
        count: issues.length,
      },
      timestamp: new Date().toISOString(),
    });
  },
};

export default myIssuesHandler;
