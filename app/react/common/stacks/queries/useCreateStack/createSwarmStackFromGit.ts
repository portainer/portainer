import axios, { parseAxiosError } from '@/portainer/services/axios';
import { Pair } from '@/react/portainer/settings/types';
import { AutoUpdateModel } from '@/react/portainer/gitops/types';
import { EnvironmentId } from '@/react/portainer/environments/types';

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

  /** URL of a Git repository hosting the Stack file */
  repositoryUrl: string;
  /** Reference name of a Git repository hosting the Stack file */
  repositoryReferenceName?: string;
  /** Use basic authentication to clone the Git repository */
  repositoryAuthentication?: boolean;
  /** Username used in basic authentication. Required when RepositoryAuthentication is true. */
  repositoryUsername?: string;
  /** Password used in basic authentication. Required when RepositoryAuthentication is true. */
  repositoryPassword?: string;
  /** GitCredentialID used to identify the binded git credential */
  repositoryGitCredentialId?: number;
  /** Path to the Stack file inside the Git repository */
  composeFile?: string;

  additionalFiles?: Array<string>;

  /** Optional GitOps update configuration */
  autoUpdate?: AutoUpdateModel;

  /** Whether the stack supports relative path volume */
  supportRelativePath?: boolean;
  /** Local filesystem path */
  filesystemPath?: string;
  /** TLSSkipVerify skips SSL verification when cloning the Git repository */
  tlsSkipVerify?: boolean;
  environmentId: EnvironmentId;
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
