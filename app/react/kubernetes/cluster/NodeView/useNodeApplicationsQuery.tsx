import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { NodeApplication } from './NodeApplicationsDatatable/types';

// useQuery to get a list of all applications from an array of namespaces
export function useAllNodeApplicationsQuery(
  environmentId: EnvironmentId,
  nodeName: string,
  queryOptions?: { refetchInterval?: number }
) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'applications', nodeName],
    () => getAllNodeApplications(environmentId, nodeName),
    {
      refetchInterval: queryOptions?.refetchInterval ?? false,
      ...withGlobalError('Unable to retrieve applications'),
    }
  );
}

// get all applications from a namespace
export async function getAllNodeApplications(
  environmentId: EnvironmentId,
  nodeName: string
) {
  try {
    const params = nodeName ? { nodeName } : {};
    const { data } = await axios.get<NodeApplication[]>(
      `/kubernetes/${environmentId}/applications`,
      { params }
    );

    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve applications');
  }
}
