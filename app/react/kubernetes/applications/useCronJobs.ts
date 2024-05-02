import { CronJob, CronJobList } from 'kubernetes-types/batch/v1';
import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';

import { parseKubernetesAxiosError } from '../axiosError';

const queryKeys = {
  cronJobsForCluster: (environmentId: EnvironmentId) => [
    'environments',
    environmentId,
    'kubernetes',
    'cronjobs',
  ],
};

export function useCronJobs(
  environmentId: EnvironmentId,
  namespaces?: string[]
) {
  return useQuery(
    queryKeys.cronJobsForCluster(environmentId),
    () => getCronJobsForCluster(environmentId, namespaces),
    {
      ...withError('Unable to retrieve CronJobs'),
      enabled: !!namespaces?.length,
    }
  );
}

export async function getCronJobsForCluster(
  environmentId: EnvironmentId,
  namespaceNames?: string[]
) {
  if (!namespaceNames) {
    return [];
  }
  const jobs = await Promise.all(
    namespaceNames.map((namespace) =>
      getNamespaceCronJobs(environmentId, namespace)
    )
  );
  return jobs.flat();
}

export async function getNamespaceCronJobs(
  environmentId: EnvironmentId,
  namespace: string,
  labelSelector?: string
) {
  try {
    const { data } = await axios.get<CronJobList>(
      `/endpoints/${environmentId}/kubernetes/apis/batch/v1/namespaces/${namespace}/cronjobs`,
      {
        params: {
          labelSelector,
        },
      }
    );
    const items = (data.items || []).map(
      (cronJob) =>
        <CronJob>{
          ...cronJob,
          kind: 'CronJob',
          apiVersion: data.apiVersion,
        }
    );
    return items;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      `Unable to retrieve CronJobs in namespace '${namespace}'`
    );
  }
}
