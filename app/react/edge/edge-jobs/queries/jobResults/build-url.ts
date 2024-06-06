import { EnvironmentId } from '@/react/portainer/environments/types';

import { EdgeJob } from '../../types';
import { buildUrl as buildEdgeJobUrl } from '../build-url';

export function buildUrl({
  action,
  id,
  taskId,
}: {
  id: EdgeJob['Id'];
  action?: 'logs';
  taskId?: EnvironmentId;
}) {
  const baseUrl = buildEdgeJobUrl({ id, action: 'tasks' });

  if (taskId) {
    return `${baseUrl}/${taskId}/${action}`;
  }

  return baseUrl;
}
