import axios, {
  json2formData,
  parseAxiosError,
} from '@/portainer/services/axios';
import { RegistryId } from '@/react/portainer/registries/types/registry';
import { Pair } from '@/react/portainer/settings/types';
import { EdgeGroup } from '@/react/edge/edge-groups/types';

import { DeploymentType, EdgeStack, StaggerConfig } from '../../types';
import { buildUrl } from '../buildUrl';

/**
 * Payload to create an EdgeStack from a git repository
 */
export type FileUploadPayload = {
  Name: string;
  file: File;
  EdgeGroups: Array<EdgeGroup['Id']>;
  DeploymentType: DeploymentType;
  Registries?: Array<RegistryId>;
  /** * Uses the manifest's namespaces instead of the default one */
  UseManifestNamespaces?: boolean;
  PrePullImage?: boolean;
  RetryDeploy?: boolean;
  /** List of environment variables */
  EnvVars?: Array<Pair>;
  /** Configuration for stagger updates */
  StaggerConfig?: StaggerConfig;
  Webhook?: string;
};

export async function createStackFromFile(payload: FileUploadPayload) {
  try {
    const { data } = await axios.post<EdgeStack>(
      buildUrl(undefined, 'create/file'),
      json2formData(payload),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
