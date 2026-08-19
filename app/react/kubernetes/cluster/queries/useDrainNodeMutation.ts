import { useMutation, useQueryClient } from '@tanstack/react-query';

import { drainNode as drainNodeApi } from '@api/sdk.gen';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withInvalidate, withError } from '@/react-tools/react-query';

import { queryKeys as applicationQueryKeys } from '../../applications/queries/query-keys';
import { DrainOptions } from '../NodeView/NodeDetails/types';

import { queryKeys } from './query-keys';

export function useDrainNodeMutation(
  environmentId: EnvironmentId,
  nodeName: string
) {
  const queryClient = useQueryClient();

  return useMutation(
    (drainOptions: DrainOptions) =>
      drainNode(environmentId, nodeName, drainOptions),
    {
      ...withInvalidate(queryClient, [
        queryKeys.nodes(environmentId),
        queryKeys.node(environmentId, nodeName),
        // invalidate apps, since drain can evict pods
        applicationQueryKeys.applications(environmentId),
      ]),
      ...withError('Unable to drain node'),
    }
  );
}

async function drainNode(
  environmentId: EnvironmentId,
  nodeName: string,
  drainOptions: DrainOptions
) {
  await drainNodeApi({
    path: { id: environmentId, name: nodeName },
    body: {
      Force: drainOptions.force,
      TimeoutSeconds: drainOptions.timeoutSeconds,
      GracePeriodSeconds: drainOptions.gracePeriodSeconds,
      IgnoreDaemonSets: drainOptions.ignoreDaemonSets,
      DeleteEmptyDirData: drainOptions.deleteEmptyDirData,
      DisableEviction: drainOptions.disableEviction,
    },
  });
}
