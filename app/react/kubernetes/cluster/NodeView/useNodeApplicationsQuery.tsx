import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';

import { parseKubernetesAxiosError } from '../../axiosError';

import { NodeApplication } from './NodeApplicationsDatatable/types';

// useQuery to get a list of all applications from an array of namespaces
export function useAllNodeApplicationsQuery(environmentId: EnvironmentId, nodeName: string) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'applications', nodeName],
    () => getAllNodeApplications(environmentId, nodeName),
    {
      ...withError('Unable to retrieve applications'),
    }
  );
}

// get all applications from a namespace
export async function getAllNodeApplications(
  environmentId: EnvironmentId,
  nodeName: string,
) {
  try {
    const params = nodeName ? { nodeName } : {};
    const { data } = await axios.get<NodeApplication[]>(
      `/kubernetes/${environmentId}/applications`,
      { params }
    );

    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve applications');
  }
}
