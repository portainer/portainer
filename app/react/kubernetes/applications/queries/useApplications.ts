import { useQuery } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Application } from '../ListView/ApplicationsDatatable/types';

import { queryKeys } from './query-keys';

type GetAppsParams = {
  namespace?: string;
  nodeName?: string;
};

type GetAppsQueryOptions = {
  refetchInterval?: number;
} & GetAppsParams;

/**
 * @returns a UseQueryResult that can be used to fetch a list of applications from an array of namespaces.
 * This api call goes to the portainer api, not the kubernetes proxy api.
 */
export function useApplications(
  environmentId: EnvironmentId,
  queryOptions?: GetAppsQueryOptions
) {
  const { refetchInterval, ...params } = queryOptions ?? {};
  return useQuery(
    queryKeys.applications(environmentId, params),
    () => getApplications(environmentId, params),
    {
      refetchInterval,
      ...withGlobalError('Unable to retrieve applications'),
    }
  );
}

// get all applications from a namespace
export async function getApplications(
  environmentId: EnvironmentId,
  params?: GetAppsParams
) {
  try {
    const { data } = await axios.get<Application[]>(
      `/kubernetes/${environmentId}/applications`,
      { params }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve applications');
  }
}
