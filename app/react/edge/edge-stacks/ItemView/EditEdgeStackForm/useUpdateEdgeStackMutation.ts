import { useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { mutationOptions, withError } from '@/react-tools/react-query';
import { buildUrl } from '@/react/edge/edge-stacks/queries/buildUrl';
import {
  DeploymentType,
  EdgeStack,
  StaggerConfig,
} from '@/react/edge/edge-stacks/types';
import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { Registry } from '@/react/portainer/registries/types/registry';
import { Pair } from '@/react/portainer/settings/types';

export interface UpdateEdgeStackPayload {
  id: EdgeStack['Id'];
  stackFileContent: string;
  edgeGroups: Array<EdgeGroup['Id']>;
  deploymentType: DeploymentType;
  registries: Array<Registry['Id']>;
  useManifestNamespaces: boolean;
  prePullImage?: boolean;
  rePullImage?: boolean;
  retryDeploy?: boolean;
  updateVersion: boolean;
  webhook?: string;
  envVars: Pair[];
  rollbackTo?: number;
  staggerConfig?: StaggerConfig;
}

export function useUpdateEdgeStackMutation() {
  return useMutation(
    updateEdgeStack,
    mutationOptions(withError('Failed updating stack'))
  );
}

async function updateEdgeStack({ id, ...payload }: UpdateEdgeStackPayload) {
  try {
    await axios.put(buildUrl(id), payload);
  } catch (err) {
    throw parseAxiosError(err as Error, 'Failed updating stack');
  }
}
