import type { PathHandler } from '../../../core/types';
import myIssuesHandler from './my-issues';
import issueDetailHandler from './issue-detail';

/**
 * All registered path handlers for the Linear plugin.
 * Add new handlers here as they are implemented.
 */
export const linearPaths: PathHandler[] = [
  myIssuesHandler,
  issueDetailHandler,
];
