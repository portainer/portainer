import { useMutation } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { ContainerId } from '@/react/docker/containers/types';
import { renameContainer } from '@/react/docker/containers/containers.service';
import { withError } from '@/react-tools/react-query';

export function useRenameContainer() {
  return useMutation({
    mutationFn: ({
      containerId,
      environmentId,
      name,
      nodeName,
    }: {
      containerId: ContainerId;
      environmentId: EnvironmentId;
      name: string;
      nodeName?: string;
    }) => renameContainer(environmentId, containerId, name, { nodeName }),

    ...withError('Failed to rename container'),
  });
}
