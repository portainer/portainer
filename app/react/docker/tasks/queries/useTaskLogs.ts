import _ from 'lodash';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { TaskId, TaskLogsParams } from '@/react/docker/tasks/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

export async function getTaskLogs(
  environmentId: EnvironmentId,
  taskId: TaskId,
  params?: TaskLogsParams
): Promise<string> {
  try {
    const { data } = await axios.get<string>(
      buildDockerProxyUrl(environmentId, 'tasks', taskId, 'logs'),
      {
        params: _.pickBy(params),
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get task logs');
  }
}
