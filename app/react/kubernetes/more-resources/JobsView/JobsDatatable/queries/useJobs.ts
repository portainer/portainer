import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Job } from '../types';

import { queryKeys } from './query-keys';

export function useJobs(
  environmentId: EnvironmentId,
  options?: { refetchInterval?: number; enabled?: boolean }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getAllJobs(environmentId),
    {
      ...withError('Unable to get Jobs'),
      refetchInterval() {
        return options?.refetchInterval ?? false;
      },
      enabled: options?.enabled,
    }
  );
}

async function getAllJobs(environmentId: EnvironmentId) {
  try {
    const { data: jobs } = await axios.get<Job[]>(
      `kubernetes/${environmentId}/jobs`
    );

    return jobs;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get Jobs');
  }
}
