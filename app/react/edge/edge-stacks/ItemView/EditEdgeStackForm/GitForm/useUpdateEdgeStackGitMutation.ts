import { useMutation } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { mutationOptions, withError } from '@/react-tools/react-query';
import {
  AutoUpdateResponse,
  GitAuthenticationResponse,
} from '@/react/portainer/gitops/types';
import { buildUrl } from '@/react/edge/edge-stacks/queries/buildUrl';
import { DeploymentType, EdgeStack } from '@/react/edge/edge-stacks/types';
import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { Registry } from '@/react/portainer/registries/types';

export interface UpdateEdgeStackGitPayload {
  id: EdgeStack['Id'];
  autoUpdate: AutoUpdateResponse | null;
  refName: string;
  authentication: GitAuthenticationResponse | null;
  groupIds: EdgeGroup['Id'][];
  deploymentType: DeploymentType;
  updateVersion: boolean;
  registries?: Array<Registry['Id']>;
}

export function useUpdateEdgeStackGitMutation() {
  return useMutation(
    updateEdgeStackGit,
    mutationOptions(withError('Failed updating stack'))
  );
}

async function updateEdgeStackGit({
  id,
  ...payload
}: UpdateEdgeStackGitPayload) {
  try {
    await axios.put(buildUrl(id, 'git'), payload);
  } catch (err) {
    throw parseAxiosError(err as Error, 'Failed updating stack');
  }
}
