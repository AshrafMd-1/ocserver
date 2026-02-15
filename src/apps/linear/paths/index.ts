import type { PathHandler } from '../../../core/types';
import myIssuesHandler from './my-issues';

/**
 * All registered path handlers for the Linear plugin.
 * Add new handlers here as they are implemented.
 */
export const linearPaths: PathHandler[] = [myIssuesHandler];
