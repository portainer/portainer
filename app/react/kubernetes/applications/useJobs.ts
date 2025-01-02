import { Job, JobList } from 'kubernetes-types/batch/v1';
import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';

import { parseKubernetesAxiosError } from '../axiosError';

const queryKeys = {
  jobsForCluster: (environmentId: EnvironmentId) => [
    'environments',
    environmentId,
    'kubernetes',
    'jobs',
  ],
};

export function useJobs(environmentId: EnvironmentId, namespaces?: string[]) {
  return useQuery(
    queryKeys.jobsForCluster(environmentId),
    () => getJobsForCluster(environmentId, namespaces),
    {
      ...withError('Unable to retrieve Jobs'),
      enabled: !!namespaces?.length,
    }
  );
}

export async function getJobsForCluster(
  environmentId: EnvironmentId,
  namespaceNames?: string[]
) {
  if (!namespaceNames) {
    return [];
  }
  const jobs = await Promise.all(
    namespaceNames.map((namespace) =>
      getNamespaceJobs(environmentId, namespace)
    )
  );
  return jobs.flat();
}

export async function getNamespaceJobs(
  environmentId: EnvironmentId,
  namespace: string,
  labelSelector?: string
) {
  try {
    const { data } = await axios.get<JobList>(
      `/endpoints/${environmentId}/kubernetes/apis/batch/v1/namespaces/${namespace}/jobs`,
      {
        params: {
          labelSelector,
        },
      }
    );
    const items = (data.items || []).map(
      (job) =>
        <Job>{
          ...job,
          kind: 'Job',
          apiVersion: data.apiVersion,
        }
    );
    return items;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      `Unable to retrieve Jobs in namespace '${namespace}'`
    );
  }
}
