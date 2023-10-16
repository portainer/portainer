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
  /** DeploymentReceived represents an edge environment which received the edge stack deployment */
  DeploymentReceived,
  /** Error represents an edge environment which failed to deploy its edge stack */
  Error,
  /** Acknowledged represents an acknowledged edge stack */
  Acknowledged,
  /** Removed represents a removed edge stack */
  Removed,
  /** StatusRemoteUpdateSuccess represents a successfully updated edge stack */
  RemoteUpdateSuccess,
  /** ImagesPulled represents a successfully images-pulling */
  ImagesPulled,
  /** Running represents a running Edge stack */
  Running,
  /** Deploying represents an Edge stack which is being deployed */
  Deploying,
  /** Removing represents an Edge stack which is being removed */
  Removing,
  /** PausedDeploying represents an Edge stack which is paused for deployment */
  PausedDeploying,
  /** PausedRemoving represents an Edge stack which is being rolled back */
  RollingBack,
  /** PausedRemoving represents an Edge stack which has been rolled back */
  RolledBack,
}

export interface DeploymentStatus {
  Type: StatusType;
  Error: string;
  Time: number;
}

interface EdgeStackDeploymentInfo {
  FileVersion: number;
  ConfigHash: string;
}

export interface EdgeStackStatus {
  Status: Array<DeploymentStatus>;
  EndpointID: EnvironmentId;
  DeploymentInfo?: EdgeStackDeploymentInfo;
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
  Status: { [key: EnvironmentId]: EdgeStackStatus };
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
