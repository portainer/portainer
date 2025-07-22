import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { compact, flatMap } from 'lodash';

import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { queryKeys } from './query-keys';

interface HelmSearch {
  entries: Entries;
}

interface Entries {
  [key: string]: { version: string; appVersion: string }[];
}

export interface ChartVersion {
  Chart?: string;
  Repo: string;
  Label?: string;
  Version: string;
  AppVersion?: string;
}

type RepoSource = {
  repo?: string;
};

/**
 * React hook to get a list of available versions for a chart from specified repositories
 *
 * @param chart The chart name to get versions for
 * @param repositories Array of repository URLs to search in
 * @param staleTime Stale time for the query
 * @param useCache Whether to use the cache for the query
 */
export function useHelmRepoVersions(
  chart: string,
  staleTime: number,
  repoSources: RepoSource[] = [],
  useCache: boolean = true
) {
  // Fetch versions from each repository in parallel as separate queries
  const versionQueries = useQueries({
    queries: useMemo(
      () =>
        repoSources.map(({ repo }) => ({
          queryKey: queryKeys.chartVersions(repo || '', chart),
          queryFn: () => getSearchHelmRepo({ repo, chart, useCache }),
          enabled: !!chart && !!repo,
          staleTime,
          ...withGlobalError(`Unable to retrieve versions from ${repo}`),
        })),
      [repoSources, chart, staleTime, useCache]
    ),
  });

  // Combine the results from all repositories for easier consumption
  const allVersions = useMemo(() => {
    const successfulResults = compact(versionQueries.map((q) => q.data));
    return flatMap(successfulResults);
  }, [versionQueries]);

  return {
    data: allVersions,
    isInitialLoading: versionQueries.some((q) => q.isInitialLoading),
    isError: versionQueries.some((q) => q.isError),
    isFetching: versionQueries.some((q) => q.isFetching),
    refetch: () => Promise.all(versionQueries.map((q) => q.refetch())),
  };
}

type SearchRepoParams = {
  repo?: string;
  chart: string;
  useCache?: boolean;
};

/**
 * Get Helm repositories for user
 */
async function getSearchHelmRepo(
  params: SearchRepoParams
): Promise<ChartVersion[]> {
  try {
    const { data } = await axios.get<HelmSearch>(`templates/helm`, {
      params,
    });
    // if separated by '/', take the last part
    const chartKey = params.chart.split('/').pop() || params.chart;
    const versions = data.entries[chartKey];
    return (
      versions?.map((v) => ({
        Repo: params.repo ?? '',
        Version: v.version,
        AppVersion: v.appVersion,
      })) ?? []
    );
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve helm repositories for user');
  }
}
