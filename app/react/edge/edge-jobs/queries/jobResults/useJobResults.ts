import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EdgeJob, JobResult } from '../../types';

import { queryKeys } from './query-keys';
import { buildUrl } from './build-url';

export function useJobResults(
  id: EdgeJob['Id'],
  {
    refetchInterval,
  }: {
    refetchInterval?:
      | number
      | false
      | ((data: Array<JobResult> | undefined) => number | false);
  } = {}
) {
  return useQuery({
    queryKey: queryKeys.base(id),
    queryFn: () => getJobResults(id),
    refetchInterval,
  });
}

async function getJobResults(id: EdgeJob['Id']) {
  try {
    const { data } = await axios.get<Array<JobResult>>(buildUrl({ id }));

    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Failed fetching edge job results');
  }
}
