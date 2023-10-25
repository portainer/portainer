import { useMutation, useQueryClient } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError, withInvalidate } from '@/react-tools/react-query';
import { AutoUpdateModel } from '@/react/portainer/gitops/types';
import { Pair } from '@/react/portainer/settings/types';
import { RegistryId } from '@/react/portainer/registries/types';
import { GitCredential } from '@/react/portainer/account/git-credentials/types';

import { DeploymentType, EdgeStack } from '../types';
import { EdgeGroup } from '../../edge-groups/types';

import { buildUrl } from './buildUrl';
import { queryKeys } from './query-keys';

export function useCreateEdgeStackFromGit() {
  const queryClient = useQueryClient();

  return useMutation(createEdgeStackFromGit, {
    ...withError('Failed creating Edge stack'),
    ...withInvalidate(queryClient, [queryKeys.base()]),
  });
}

/**
 * Represents the payload for creating an edge stack from a Git repository.
 */
interface GitPayload {
  /** Name of the stack. */
  name: string;
  /** URL of a Git repository hosting the Stack file. */
  repositoryURL: string;
  /** Reference name of a Git repository hosting the Stack file. */
  repositoryReferenceName?: string;
  /** Use basic authentication to clone the Git repository. */
  repositoryAuthentication?: boolean;
  /** Username used in basic authentication. Required when RepositoryAuthentication is true. */
  repositoryUsername?: string;
  /** Password used in basic authentication. Required when RepositoryAuthentication is true. */
  repositoryPassword?: string;
  /** GitCredentialID used to identify the bound git credential. */
  repositoryGitCredentialID?: GitCredential['id'];
  /** Path to the Stack file inside the Git repository. */
  filePathInRepository?: string;
  /** List of identifiers of EdgeGroups. */
  edgeGroups: Array<EdgeGroup['Id']>;
  /** Deployment type to deploy this stack. */
  deploymentType: DeploymentType;
  /** List of Registries to use for this stack. */
  registries?: RegistryId[];
  /** Uses the manifest's namespaces instead of the default one. */
  useManifestNamespaces?: boolean;
  /** Pre-pull image. */
  prePullImage?: boolean;
  /** Retry deploy. */
  retryDeploy?: boolean;
  /** TLSSkipVerify skips SSL verification when cloning the Git repository. */
  tLSSkipVerify?: boolean;
  /** Optional GitOps update configuration. */
  autoUpdate?: AutoUpdateModel;
  /** Whether the stack supports relative path volume. */
  supportRelativePath?: boolean;
  /** Local filesystem path. */
  filesystemPath?: string;
  /** Whether the edge stack supports per device configs. */
  supportPerDeviceConfigs?: boolean;
  /** Per device configs match type. */
  perDeviceConfigsMatchType?: 'file' | 'dir';
  /** Per device configs group match type. */
  perDeviceConfigsGroupMatchType?: 'file' | 'dir';
  /** Per device configs path. */
  perDeviceConfigsPath?: string;
  /** List of environment variables. */
  envVars?: Pair[];
  /** Configuration for stagger updates. */
  staggerConfig?: EdgeStaggerConfig;
}
/**
 * Represents the staggered updates configuration.
 */
interface EdgeStaggerConfig {
  /** Stagger option for updates. */
  staggerOption: EdgeStaggerOption;
  /** Stagger parallel option for updates. */
  staggerParallelOption: EdgeStaggerParallelOption;
  /** Device number for updates. */
  deviceNumber: number;
  /** Starting device number for updates. */
  deviceNumberStartFrom: number;
  /** Increment value for device numbers during updates. */
  deviceNumberIncrementBy: number;
  /** Timeout for updates (in minutes). */
  timeout: string;
  /** Update delay (in minutes). */
  updateDelay: string;
  /** Action to take in case of update failure. */
  updateFailureAction: EdgeUpdateFailureAction;
}

/** EdgeStaggerOption represents an Edge stack stagger option */
enum EdgeStaggerOption {
  /** AllAtOnce represents a staggered deployment where all nodes are updated at once */
  AllAtOnce = 1,
  /** OneByOne represents a staggered deployment where nodes are updated with parallel setting  */
  Parallel,
}

/** EdgeStaggerParallelOption represents an Edge stack stagger parallel option */
enum EdgeStaggerParallelOption {
  /** Fixed represents a staggered deployment where nodes are updated with a fixed number of nodes in parallel */
  Fixed = 1,
  /** Incremental represents a staggered deployment where nodes are updated with an incremental number of nodes in parallel */
  Incremental,
}

/** EdgeUpdateFailureAction represents an Edge stack update failure action */
enum EdgeUpdateFailureAction {
  /** Continue represents that stagger update will continue regardless of whether the endpoint update status */
  Continue = 1,
  /** Pause represents that stagger update will pause when the endpoint update status is failed */
  Pause,
  /** Rollback represents that stagger update will rollback as long as one endpoint update status is failed */
  Rollback,
}

export async function createEdgeStackFromGit({
  dryRun,
  ...payload
}: GitPayload & { dryRun?: boolean }) {
  try {
    const { data } = await axios.post<EdgeStack>(
      buildUrl(undefined, 'create/repository'),
      payload,
      {
        params: { dryrun: dryRun ? 'true' : 'false' },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
