import { useMutation } from '@tanstack/react-query';

import { getSwarm } from '@/react/docker/proxy/queries/useSwarm';
import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import { StackType } from '../../../../../common/stacks/types';
import { buildStackUrl } from '../../../../../common/stacks/queries/buildUrl';

export function useMigrateStackMutation() {
  return useMutation({
    mutationFn: routeMigrationRequest,
  });
}

export function routeMigrationRequest({
  stackType,
  id,
  fromEnvId,
  targetEnvId,
  name,
  fromSwarmId,
}: {
  stackType: StackType;
  fromSwarmId?: string;
  id: number;
  fromEnvId: EnvironmentId;
  targetEnvId: EnvironmentId;
  name?: string;
}) {
  if (stackType === StackType.DockerSwarm) {
    return migrateSwarmStack({ id, fromEnvId, targetEnvId, name, fromSwarmId });
  }

  return migrateStack({ id, fromEnvId, targetEnvId, name });
}

export async function migrateSwarmStack({
  id,
  fromEnvId,
  targetEnvId,
  fromSwarmId,
  name,
}: {
  id: number;
  fromEnvId: EnvironmentId;
  targetEnvId: EnvironmentId;
  fromSwarmId?: string;
  name?: string;
}) {
  if (!fromSwarmId) {
    throw new Error('Original Swarm ID is required to migrate a Swarm stack');
  }

  const targetSwarm = await getSwarm(targetEnvId);
  if (fromEnvId !== targetEnvId && fromSwarmId === targetSwarm.ID) {
    throw new Error(
      'Target environment is located in the same Swarm cluster as the current environment'
    );
  }

  return migrateStack({
    id,
    fromEnvId,
    targetEnvId,
    name,
    targetSwarmId: targetSwarm.ID,
  });
}

export async function migrateStack({
  id,
  fromEnvId,
  targetEnvId,
  name,
  targetSwarmId,
}: {
  id: number;
  fromEnvId: EnvironmentId;
  targetEnvId: EnvironmentId;
  name?: string;
  targetSwarmId?: string;
}) {
  try {
    return await axios.post(
      buildStackUrl(id, 'migrate'),
      {
        EndpointID: targetEnvId,
        Name: name,
        SwarmID: targetSwarmId,
      },
      {
        params: {
          endpointId: fromEnvId,
        },
      }
    );
  } catch (err) {
    throw parseAxiosError(err);
  }
}
