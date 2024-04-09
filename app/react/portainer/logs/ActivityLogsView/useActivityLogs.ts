import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { isBE } from '../../feature-flags/feature-flags.service';

import { ActivityLog } from './types';

export const sortKeys = ['Context', 'Action', 'Timestamp', 'Username'] as const;
export type SortKey = (typeof sortKeys)[number];
export function isSortKey(value?: string): value is SortKey {
  return !!value && sortKeys.includes(value as SortKey);
}
export function getSortType(value?: string): SortKey | undefined {
  return isSortKey(value) ? value : undefined;
}

export interface Query {
  offset: number;
  limit: number;
  sortBy?: SortKey;
  desc?: boolean;
  search: string;
  after?: number;
  before?: number;
}

export function useActivityLogs(query: Query) {
  return useQuery({
    queryKey: ['activityLogs', query] as const,
    queryFn: () => fetchActivityLogs(query),
    keepPreviousData: true,
  });
}

interface ActivityLogsResponse {
  logs: Array<ActivityLog>;
  totalCount: number;
}

async function fetchActivityLogs(query: Query): Promise<ActivityLogsResponse> {
  try {
    if (!isBE) {
      return {
        logs: [{}, {}, {}, {}, {}] as Array<ActivityLog>,
        totalCount: 5,
      };
    }

    const { data } = await axios.get<ActivityLogsResponse>(
      '/useractivity/logs',
      { params: query }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Failed loading user activity logs csv');
  }
}
