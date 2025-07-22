import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { queryKeys } from './query-keys';

type Params = {
  /** The name of the chart to get the values for */
  chart: string;
  /** The repository URL or registry ID */
  repo: string;
  /** The version of the chart to get the values for */
  version?: string;
};

export function useHelmChartValues(params: Params, isLatestVersion = false) {
  const hasValidRepoUrl = !!params.repo;
  return useQuery({
    queryKey: queryKeys.chartValues(
      params.repo,
      params.chart,
      // if the latest version is fetched, use the latest version key to cache the latest version
      isLatestVersion ? 'latest' : params.version || 'latest'
    ),
    queryFn: () => getHelmChartValues(params),
    enabled: !!params.chart && hasValidRepoUrl,
    select: (data) => ({
      values: data,
    }),
    retry: 1,
    staleTime: 60 * 1000 * 20, // 60 minutes, because values are not expected to change often
    ...withGlobalError('Unable to get Helm chart values'),
  });
}

async function getHelmChartValues(params: Params) {
  try {
    const response = await axios.get<string>(`/templates/helm/values`, {
      params,
    });
    return response.data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to get Helm chart values');
  }
}
