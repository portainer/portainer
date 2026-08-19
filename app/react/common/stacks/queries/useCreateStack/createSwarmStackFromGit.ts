import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { Pair } from '@/react/portainer/settings/types';
import { AutoUpdateResponse } from '@/react/portainer/gitops/types';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { RegistryId } from '@/react/portainer/registries/types/registry';

import { Stack } from '../../types';

import { buildCreateUrl } from './buildUrl';

export type SwarmGitRepositoryPayload = {
  /** Name of the stack */
  name: string;
  /** List of environment variables */
  env?: Array<Pair>;
  /** Whether the stack is from an app template */
  fromAppTemplate?: boolean;
  /** Swarm cluster identifier */
  swarmID: string;

  /** URL of a Git repository hosting the Stack file (used for app templates) */
  repositoryUrl?: string;
  /** Reference name of a Git repository hosting the Stack file */
  repositoryReferenceName?: string;

  /** Path to the Stack file inside the Git repository */
  composeFile?: string;

  additionalFiles?: Array<string>;

  /** Optional GitOps update configuration */
  autoUpdate?: AutoUpdateResponse | null;

  /** Whether the stack supports relative path volume */
  supportRelativePath?: boolean;
  /** Local filesystem path */
  filesystemPath?: string;

  /** ID of an existing Source. When set, repositoryUrl and authentication fields are ignored. */
  sourceId?: number;
  environmentId: EnvironmentId;
  registries?: Array<RegistryId>;
};

export async function createSwarmStackFromGit({
  environmentId,
  ...payload
}: SwarmGitRepositoryPayload) {
  try {
    const { data } = await axios.post<Stack>(
      buildCreateUrl('swarm', 'repository'),
      payload,
      {
        params: { endpointId: environmentId },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
