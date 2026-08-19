import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import {
  PaginatedResults,
  withPaginationHeaders,
} from '@/react/common/api/pagination.types';
import {
  BaseQueryOptions,
  BaseQueryParams,
  queryParamsFromQueryOptions,
} from '@/react/common/api/listQueryParams';

import { EdgeJob, JobResult } from '../../types';
import { sortOptions } from '../../ItemView/ResultsDatatable/columns';

import { queryKeys } from './query-keys';

type QueryOptions = BaseQueryOptions<typeof sortOptions>;

type RefetchInterval =
  | number
  | false
  | ((data: PaginatedResults<Array<JobResult>> | undefined) => number | false);

export function useJobResults(
  id: EdgeJob['Id'],
  {
    refetchInterval,
    ...query
  }: {
    refetchInterval?: RefetchInterval;
  } & QueryOptions = {}
) {
  return useQuery({
    queryKey: [...queryKeys.base(id), query],
    queryFn: () => getJobResults(id, queryParamsFromQueryOptions(query)),
    refetchInterval,
  });
}

type QueryParams = BaseQueryParams<typeof sortOptions>;

async function getJobResults(id: EdgeJob['Id'], params?: QueryParams) {
  try {
    const response = await axios.get<Array<JobResult>>(
      `edge_jobs/${id}/tasks`,
      { params }
    );

    return withPaginationHeaders(response);
  } catch (err) {
    throw parseAxiosError(err, 'Failed fetching edge job results');
  }
}
