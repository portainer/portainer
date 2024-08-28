import axios, { parseAxiosError } from '@/portainer/services/axios';
import { RegistryId } from '@/react/portainer/registries/types/registry';
import { Pair } from '@/react/portainer/settings/types';
import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { AutoUpdateResponse } from '@/react/portainer/gitops/types';

import { DeploymentType, EdgeStack, StaggerConfig } from '../../types';
import { buildUrl } from '../buildUrl';

/**
 * Payload to create an EdgeStack from a git repository
 */
export type GitRepositoryPayload = {
  /** Name of the stack */
  name: string;
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
  filePathInRepository?: string;
  /** List of identifiers of EdgeGroups */
  edgeGroups: Array<EdgeGroup['Id']>;
  /** Deployment type to deploy this stack. Valid values are: 0 - 'compose', 1 - 'kubernetes'. Compose is enabled only for docker environments, kubernetes is enabled only for kubernetes environments */
  deploymentType: DeploymentType;
  /** List of Registries to use for this stack */
  registries?: Array<RegistryId>;
  /** Uses the manifest's namespaces instead of the default one */
  useManifestNamespaces?: boolean;
  /** Pre Pull image */
  prePullImage?: boolean;
  /** Retry deploy */
  retryDeploy?: boolean;
  /** TLSSkipVerify skips SSL verification when cloning the Git repository */
  tlsSkipVerify?: boolean;
  /** Optional GitOps update configuration */
  autoUpdate: AutoUpdateResponse | null;
  /** Whether the stack supports relative path volume */
  supportRelativePath?: boolean;
  /** Local filesystem path */
  filesystemPath?: string;
  /** Whether the edge stack supports per device configs */
  supportPerDeviceConfigs?: boolean;
  /** Per device configs match type */
  perDeviceConfigsMatchType?: string;
  /** Per device configs group match type */
  perDeviceConfigsGroupMatchType?: string;
  /** Per device configs path */
  perDeviceConfigsPath?: string;
  /** List of environment variables */
  envVars?: Array<Pair>;
  /** Configuration for stagger updates */
  staggerConfig?: StaggerConfig;
};

export async function createStackFromGit(payload: GitRepositoryPayload) {
  try {
    const { data } = await axios.post<EdgeStack>(
      buildUrl(undefined, 'create/repository'),
      payload
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
