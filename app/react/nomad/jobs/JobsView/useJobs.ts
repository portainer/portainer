import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { Job } from '@/react/nomad/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

export function useJobs(environmentId: EnvironmentId) {
  return useQuery<Job[]>(
    ['environments', environmentId, 'nomad', 'jobs'],
    () => listJobs(environmentId),
    {
      meta: {
        error: {
          title: 'Failure',
          message: 'Unable to list jobs',
        },
      },
    }
  );
}

export async function listJobs(environmentId: EnvironmentId) {
  try {
    const { data: jobs } = await axios.get<Job[]>(
      `/nomad/endpoints/${environmentId}/jobs`,
      {
        params: {},
      }
    );
    return jobs;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
