import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { AutoUpdateResponse } from '@/react/portainer/gitops/types';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Stack } from '../../types';

import { buildCreateUrl } from './buildUrl';

export type KubernetesGitRepositoryPayload = {
  /** Name of the stack */
  stackName: string;
  composeFormat: boolean;
  namespace: string;

  /** When set, URL and auth are resolved from the stored Source record */
  sourceId?: number;

  /** Reference name of a Git repository hosting the Stack file */
  repositoryReferenceName?: string;

  /** Path to the Stack file inside the Git repository */
  manifestFile?: string;

  additionalFiles?: Array<string>;

  /** Optional GitOps update configuration */
  autoUpdate?: AutoUpdateResponse | null;
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
