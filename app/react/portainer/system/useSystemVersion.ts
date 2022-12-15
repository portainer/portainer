import { useQuery } from 'react-query';

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
  DatabaseVersion: string;
  Build: {
    BuildNumber: string;
    ImageTag: string;
    NodejsVersion: string;
    YarnVersion: string;
    WebpackVersion: string;
    GoVersion: string;
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
  return useQuery(queryKey, () => getSystemVersion());
}
