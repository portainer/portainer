import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export const queryKey = [...queryKeys.base(), 'version'] as const;

export interface VersionResponse {
  // Whether portainer has an update available
  UpdateAvailable: boolean;
  // The latest version available
  LatestVersion: string;
  ServerVersion: string;
  VersionSupport: 'STS' | 'LTS';
  DatabaseVersion: string;
  Build: {
    BuildNumber: string;
    ImageTag: string;
    NodejsVersion: string;
    YarnVersion: string;
    WebpackVersion: string;
    GoVersion: string;
    GitCommit: string;
  };
  Dependencies: {
    DockerVersion: string;
    HelmVersion: string;
    KubectlVersion: string;
    ComposeVersion: string;
  };
  Runtime: {
    Env?: string[];
  };
}

export async function getSystemVersion() {
  try {
    const { data } = await axios.get<VersionResponse>(buildUrl('version'));
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

export function useSystemVersion() {
  return useQuery(queryKey, () => getSystemVersion(), {
    // 24 hour stale time to reduce the number of requests to avoid github api rate limits
    // a hard refresh of the browser will still trigger a new request
    staleTime: 24 * 60 * 60 * 1000,
  });
}
