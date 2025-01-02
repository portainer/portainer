import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { isBE } from '../../feature-flags/feature-flags.service';

import { ActivityLogResponse, ActivityLogsResponse } from './types';

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
  sortDesc?: boolean;
  search: string;
  after?: number;
  before?: number;
}

export function useActivityLogs(query: Query) {
  return useQuery({
    queryKey: ['activityLogs', query] as const,
    queryFn: () => fetchActivityLogs(query),
    keepPreviousData: true,
    select: (data) => ({
      ...data,
      logs: decorateLogs(data.logs),
    }),
  });
}

async function fetchActivityLogs(query: Query): Promise<ActivityLogsResponse> {
  try {
    if (!isBE) {
      return {
        logs: [{}, {}, {}, {}, {}] as Array<ActivityLogResponse>,
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

/**
 * Decorates logs with the payload parsed from base64
 */
function decorateLogs(logs?: ActivityLogResponse[]) {
  if (!logs || logs.length === 0) {
    return [];
  }

  return logs.map((log) => ({
    ...log,
    payload: parseBase64AsObject(log.payload),
  }));
}

function parseBase64AsObject(value: string): string | object {
  if (!value) {
    return value;
  }
  try {
    return JSON.parse(safeAtob(value));
  } catch (err) {
    return safeAtob(value);
  }
}

function safeAtob(value: string) {
  if (!value) {
    return value;
  }
  try {
    return window.atob(value);
  } catch (err) {
    // If the payload is not base64 encoded, return the original value
    return value;
  }
}
