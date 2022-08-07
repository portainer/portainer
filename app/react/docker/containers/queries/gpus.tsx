import { useQuery } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

async function getContainerGpus(
  environmentId: EnvironmentId,
  containerId: string
) {
  try {
    const { data } = await axios.get<{ gpus: string }>(
      `/docker/${environmentId}/containers/${containerId}/gpus`
    );
    return data.gpus;
  } catch (err) {
    throw parseAxiosError(err as Error);
  }
}

export function useContainerGpus(
  environmentId: EnvironmentId,
  containerId: string
) {
  return useQuery(
    [
      'environments',
      environmentId,
      'docker',
      'containers',
      containerId,
      'gpus',
    ],
    () => getContainerGpus(environmentId, containerId)
  );
}
