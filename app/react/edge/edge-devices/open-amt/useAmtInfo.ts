import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';

interface AMTInformation {
  uuid: string;
  amt: string;
  buildNumber: string;
  controlMode: string;
  dnsSuffix: string;
  rawOutput: string;
}

export function useAMTInfo(
  environmentId: EnvironmentId,
  { enabled = true } = {}
) {
  return useQuery({
    queryKey: queryKeys.info(environmentId),
    queryFn: () => getAMTInfo(environmentId),
    enabled,
  });
}

async function getAMTInfo(environmentId: EnvironmentId) {
  try {
    const { data: amtInformation } = await axios.get<AMTInformation>(
      `/open_amt/${environmentId}/info`
    );

    return amtInformation;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve environment information');
  }
}
