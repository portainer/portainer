import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerUrl } from './buildDockerUrl';

export const queryKeys = {
  root: (environmentId: EnvironmentId) => ['docker', environmentId] as const,
  snapshot: (environmentId: EnvironmentId) =>
    [...queryKeys.root(environmentId), 'snapshot'] as const,
  snapshotQuery: (environmentId: EnvironmentId) =>
    [...queryKeys.snapshot(environmentId)] as const,
  plugins: (environmentId: EnvironmentId) =>
    [...queryKeys.root(environmentId), 'plugins'] as const,
};

export function buildDockerSnapshotUrl(environmentId: EnvironmentId) {
  return buildDockerUrl(environmentId, 'snapshot');
}
