import { Task } from 'docker-types/generated/1.41';
import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { TaskId } from '@/react/docker/tasks/types';
import { queryKeys } from '@/react/docker/tasks/queries/query-keys';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withGlobalError } from '@/react-tools/react-query';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

export function useTask(environmentId: EnvironmentId, taskId: TaskId) {
  return useQuery(
    queryKeys.task(environmentId, taskId),

    () => getTask(environmentId, taskId),
    {
      ...withGlobalError('Unable to retrieve task'),
    }
  );
}

export async function getTask(environmentId: EnvironmentId, taskId: TaskId) {
  try {
    const { data } = await axios.get<Task>(
      buildDockerProxyUrl(environmentId, 'tasks', taskId)
    );

    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get task');
  }
}
