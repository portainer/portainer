import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Device } from './types';
import { queryKeys } from './query-keys';

export function useAMTDevices(
  environmentId: EnvironmentId,
  { enabled }: { enabled?: boolean } = {}
) {
  return useQuery(
    queryKeys.devices(environmentId),
    () => getDevices(environmentId),
    {
      ...withError('Failed retrieving AMT devices'),
      enabled,
    }
  );
}

async function getDevices(environmentId: EnvironmentId) {
  try {
    const { data: devices } = await axios.get<Device[]>(
      `/open_amt/${environmentId}/devices`
    );

    return devices;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve device information');
  }
}
