import { TagId } from '@/portainer/tags/types';
import { EnvironmentGroupId } from '@/react/portainer/environments/environment-groups/types';

import { EdgeGroup } from '../../edge-groups/types';

export type Platform = 'standalone' | 'swarm' | 'podman' | 'k8s';
export type OS = 'win' | 'linux';

export interface ScriptFormValues {
  authEnabled: boolean;
  tlsEnabled: boolean;

  allowSelfSignedCertificates: boolean;
  envVars: string;

  os: OS;
  platform: Platform;

  edgeIdGenerator: string;

  group: EnvironmentGroupId;
  edgeGroupsIds: Array<EdgeGroup['Id']>;
  tagsIds: Array<TagId>;
}

export interface EdgeInfo {
  id?: string;
  key: string;
}
