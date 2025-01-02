import axios, { parseAxiosError } from '@/portainer/services/axios';
import { RegistryId } from '@/react/portainer/registries/types/registry';
import { Pair } from '@/react/portainer/settings/types';
import { EdgeGroup } from '@/react/edge/edge-groups/types';

import { DeploymentType, EdgeStack, StaggerConfig } from '../../types';
import { buildUrl } from '../buildUrl';

/**
 * Payload for creating an EdgeStack from a string
 */
export interface FileContentPayload {
  /** Name of the stack */
  name: string;
  /** Content of the Stack file */
  stackFileContent: string;
  /** List of identifiers of EdgeGroups */
  edgeGroups: Array<EdgeGroup['Id']>;
  /** Deployment type to deploy this stack */
  deploymentType: DeploymentType;
  /** List of Registries to use for this stack */
  registries?: Array<RegistryId>;
  /** Uses the manifest's namespaces instead of the default one */
  useManifestNamespaces?: boolean;
  /** Pre Pull image */
  prePullImage?: boolean;
  /** Retry deploy */
  retryDeploy?: boolean;
  /** Optional webhook configuration */
  webhook?: string;
  /** List of environment variables */
  envVars?: Array<Pair>;
  /** Configuration for stagger updates */
  staggerConfig?: StaggerConfig;
}

export async function createStackFromFileContent(payload: FileContentPayload) {
  try {
    const { data } = await axios.post<EdgeStack>(
      buildUrl(undefined, 'create/string'),
      payload
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
