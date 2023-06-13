import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  AutoUpdateResponse,
  RepoConfigResponse,
} from '@/react/portainer/gitops/types';
import { RegistryId } from '@/react/portainer/registries/types';

import { EnvVar } from '@@/form-components/EnvironmentVariablesFieldset/types';

import { EdgeGroup } from '../edge-groups/types';

export enum StatusType {
  /** Pending represents a pending edge stack */
  Pending,
  /** Ok represents a successfully deployed edge stack */
  Ok,
  /** Error represents an edge environment which failed to deploy its edge stack */
  Error,
  /** Acknowledged represents an acknowledged edge stack */
  Acknowledged,
  /** Remove represents a removed edge stack */
  Remove,
  /** StatusRemoteUpdateSuccess represents a successfully updated edge stack */
  RemoteUpdateSuccess,
  /** ImagesPulled represents a successfully images-pulling */
  ImagesPulled,
}

export interface EdgeStackStatus {
  Type: StatusType;
  Error: string;
  EndpointID: EnvironmentId;
  Time: number;
}

export enum DeploymentType {
  /** represent an edge stack deployed using a compose file */
  Compose,
  /** represent an edge stack deployed using a kubernetes manifest file */
  Kubernetes,
  /** represent an edge stack deployed using a nomad hcl job file */
  Nomad,
}

export type EdgeStack = {
  Id: number;
  Name: string;
  StatusArray: { [key: EnvironmentId]: Array<EdgeStackStatus> };
  CreationDate: number;
  EdgeGroups: Array<EdgeGroup['Id']>;
  Registries: RegistryId[];
  ProjectPath: string;
  EntryPoint: string;
  Version: number;
  NumDeployments: number;
  ManifestPath: string;
  DeploymentType: DeploymentType;
  EdgeUpdateID: number;
  ScheduledTime: string;
  UseManifestNamespaces: boolean;
  PrePullImage: boolean;
  RePullImage: boolean;
  AutoUpdate?: AutoUpdateResponse;
  GitConfig?: RepoConfigResponse;
  Prune: boolean;
  RetryDeploy: boolean;
  Webhook?: string;
  StackFileVersion?: number;
  EnvVars?: EnvVar[];
};

export enum EditorType {
  Compose,
  Kubernetes,
  Nomad,
}
