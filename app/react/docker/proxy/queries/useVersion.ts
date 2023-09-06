import { useQuery } from 'react-query';
import { SystemVersion } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl } from './build-url';

export async function getVersion(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<SystemVersion>(
      buildUrl(environmentId, 'version')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve version');
  }
}

export function useVersion<TSelect = SystemVersion>(
  environmentId: EnvironmentId,
  select?: (info: SystemVersion) => TSelect
) {
  return useQuery(
    ['environment', environmentId, 'docker', 'version'],
    () => getVersion(environmentId),
    {
      select,
    }
  );
}

export function useApiVersion(environmentId: EnvironmentId) {
  const query = useVersion(environmentId, (info) => info.ApiVersion);
  return query.data ? parseFloat(query.data) : 0;
}
