import { compact } from 'lodash';
import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { Chart, HelmChartsResponse } from '../types';

import { queryKeys } from './query-keys';

/**
 * React hook to fetch helm charts from the provided HTTP repository.
 * Charts are loaded from the specified repository URL.
 *
 * @param userId User ID
 * @param repository Repository URL to fetch charts from
 * @param enabled Flag indicating if the query should be enabled
 * @returns Query result containing helm charts
 */
export function useHelmHTTPChartList(
  userId: number,
  repository: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: queryKeys.charts(userId, repository),
    queryFn: () => getChartsFromRepo(repository),
    enabled: !!userId && !!repository && enabled,
    // one request takes a long time, so fail early to get feedback to the user faster
    retry: false,
    ...withGlobalError(`Unable to retrieve Helm charts from ${repository}`),
    cacheTime: 1000 * 60 * 60 * 8, // 8 hours so that the chart list populates faster (keep stale time the same to always revalidate)
  });
}

async function getChartsFromRepo(repo: string): Promise<Chart[]> {
  try {
    // Construct the URL with required repo parameter
    const response = await axios.get<HelmChartsResponse>('templates/helm', {
      params: { repo },
    });

    return compact(
      Object.values(response.data.entries).map((versions) =>
        versions[0]
          ? {
              ...versions[0],
              repo,
              // versions are within this response too, so we don't need a new query to fetch versions when this is used
              versions: versions.map((v) => v.version),
            }
          : null
      )
    );
  } catch (error) {
    // Ignore errors from chart repositories as some may error but others may not
    return [];
  }
}
