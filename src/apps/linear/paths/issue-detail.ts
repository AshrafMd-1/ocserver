import type { Request, Response } from 'express';
import type { PathHandler } from '../../../core/types';
import { fetchIssueByIdentifier } from '../client';

/**
 * Handler for GET /linear/issue/:identifier
 * Fetches a single Linear issue by identifier (e.g., "PROJ-123")
 * Returns full issue details including description and all comments.
 */
const issueDetailHandler: PathHandler = {
  name: 'issue/:identifier',
  description: 'Fetch a single issue by identifier with details and comments',
  handler: async (req: Request, res: Response): Promise<void> => {
    const { identifier } = req.params;

    if (!identifier) {
      res.status(400).json({
        error: 'Issue identifier is required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { issue, comments } = await fetchIssueByIdentifier(identifier);

    res.json({
      app: 'linear',
      path: 'issue',
      data: {
        issue,
        comments,
        commentCount: comments.length,
      },
      timestamp: new Date().toISOString(),
    });
  },
};

export default issueDetailHandler;
