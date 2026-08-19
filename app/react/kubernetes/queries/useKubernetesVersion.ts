import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';

export interface KubernetesVersionInfo {
  major: string;
  minor: string;
  gitVersion: string;
  gitCommit: string;
  gitTreeState: string;
  buildDate: string;
  goVersion: string;
  compiler: string;
  platform: string;
  supportsPodRestart: boolean;
}

export function useKubernetesVersion(environmentId: EnvironmentId) {
  return useQuery(
    [...queryKeys.base(environmentId), 'version'] as const,
    () => getKubernetesVersion(environmentId),
    withError('Unable to retrieve Kubernetes cluster version')
  );
}

async function getKubernetesVersion(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<KubernetesVersionInfo>(
      `/kubernetes/${environmentId}/version`
    );
    return data;
  } catch (error) {
    throw parseAxiosError(
      error as Error,
      'Unable to retrieve Kubernetes cluster version'
    );
  }
}
