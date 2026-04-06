import { useMutation } from '@tanstack/react-query';

import { getSwarm } from '@/react/docker/proxy/queries/useSwarm';
import { Pair } from '@/react/portainer/settings/types';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { createStandaloneStackFromFileContent } from '../../../../../common/stacks/queries/useCreateStack/createStandaloneStackFromFileContent';
import { createSwarmStackFromFileContent } from '../../../../../common/stacks/queries/useCreateStack/createSwarmStackFromFileContent';
import { StackType } from '../../../../../common/stacks/types';

export function useDuplicateStackMutation() {
  return useMutation({
    mutationFn: duplicateStack,
  });
}

export async function duplicateStack({
  name,
  fileContent,
  targetEnvironmentId,
  type,
  env,
}: {
  name: string;
  fileContent: string;
  targetEnvironmentId: EnvironmentId;
  type: StackType;
  env?: Array<Pair> | null;
}) {
  if (type === StackType.DockerSwarm) {
    const swarm = await getSwarm(targetEnvironmentId);

    if (!swarm.ID) {
      throw new Error('Swarm ID is required to duplicate a Swarm stack');
    }

    return createSwarmStackFromFileContent({
      environmentId: targetEnvironmentId,
      name,
      stackFileContent: fileContent,
      swarmID: swarm.ID,
      env,
    });
  }
  return createStandaloneStackFromFileContent({
    environmentId: targetEnvironmentId,
    name,
    stackFileContent: fileContent,
    env,
  });
}
