import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  AutoUpdateResponse,
  RepoConfigResponse,
} from '@/react/portainer/gitops/types';
import { RegistryId } from '@/react/portainer/registries/types';

import { EdgeGroup } from '../edge-groups/types';

interface EdgeStackStatusDetails {
  Pending: boolean;
  Ok: boolean;
  Error: boolean;
  Acknowledged: boolean;
  Remove: boolean;
  RemoteUpdateSuccess: boolean;
  ImagesPulled: boolean;
}

export type StatusType = keyof EdgeStackStatusDetails;

export interface EdgeStackStatus {
  Details: EdgeStackStatusDetails;
  Error: string;
  EndpointID: EnvironmentId;
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
};

export enum EditorType {
  Compose,
  Kubernetes,
  Nomad,
}
