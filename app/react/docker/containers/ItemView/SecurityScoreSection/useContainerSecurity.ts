import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withAgentTargetHeader } from '@/react/docker/proxy/queries/utils';
import { ContainerId } from '@/react/docker/containers/types';
import { queryKeys } from '@/react/docker/containers/queries/query-keys';

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface SecurityCheck {
  id: string;
  title: string;
  description: string;
  risk: string;
  fix: string;
  status: CheckStatus;
  weight?: number;
}

export interface SecurityReport {
  score: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  checks: SecurityCheck[];
}

export function useContainerSecurity(
  environmentId: EnvironmentId,
  containerId: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  return useQuery({
    queryKey: [
      ...queryKeys.container(environmentId, containerId),
      'security',
      { nodeName },
    ] as const,
    queryFn: () =>
      getContainerSecurity(environmentId, containerId, { nodeName }),
  });
}

async function getContainerSecurity(
  environmentId: EnvironmentId,
  containerId: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    const { data } = await axios.get<SecurityReport>(
      `/docker/${environmentId}/containers/${containerId}/security`,
      { headers: { ...withAgentTargetHeader(nodeName) } }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Failed loading container security report');
  }
}
