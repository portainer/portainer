import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl } from './build-url';

export interface VersionResponse {
  ApiVersion: string;
}

export async function getVersion(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<VersionResponse>(
      buildUrl(environmentId, 'version')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve version');
  }
}

export function useVersion<TSelect = VersionResponse>(
  environmentId: EnvironmentId,
  select?: (info: VersionResponse) => TSelect
) {
  return useQuery(
    ['environment', environmentId, 'docker', 'version'],
    () => getVersion(environmentId),
    {
      select,
    }
  );
}
