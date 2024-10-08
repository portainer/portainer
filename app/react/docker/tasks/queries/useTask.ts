import { Task } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { TaskId } from '@/react/docker/tasks/types';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

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
