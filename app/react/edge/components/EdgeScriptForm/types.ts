import { TagId } from '@/portainer/tags/types';
import { EnvironmentGroupId } from '@/react/portainer/environments/environment-groups/types';

import { EdgeGroup } from '../../edge-groups/types';

export type Platform = 'standalone' | 'swarm' | 'k8s' | 'nomad';
export type OS = 'win' | 'linux';

export interface ScriptFormValues {
  nomadToken: string;
  authEnabled: boolean;
  tlsEnabled: boolean;

  allowSelfSignedCertificates: boolean;
  envVars: string;

  os: OS;
  platform: Platform;

  edgeIdGenerator?: string;

  group: EnvironmentGroupId;
  edgeGroupsIds: Array<EdgeGroup['Id']>;
  tagsIds: Array<TagId>;
}

export interface EdgeInfo {
  id?: string;
  key: string;
}
