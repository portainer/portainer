import axios, { parseAxiosError } from '@/portainer/services/axios';
import { AutoUpdateModel } from '@/react/portainer/gitops/types';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Stack } from '../../types';

import { buildCreateUrl } from './buildUrl';

export type KubernetesGitRepositoryPayload = {
  /** Name of the stack */
  stackName: string;
  composeFormat: boolean;
  namespace: string;

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
  manifestFile?: string;

  additionalFiles?: Array<string>;
  /** TLSSkipVerify skips SSL verification when cloning the Git repository */
  tlsSkipVerify?: boolean;
  /** Optional GitOps update configuration */
  autoUpdate?: AutoUpdateModel;
  environmentId: EnvironmentId;
};

export async function createKubernetesStackFromGit({
  environmentId,
  ...payload
}: KubernetesGitRepositoryPayload) {
  try {
    const { data } = await axios.post<Stack>(
      buildCreateUrl('kubernetes', 'repository'),
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
