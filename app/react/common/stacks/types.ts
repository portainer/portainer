import { ResourceControlResponse } from '@/react/portainer/access-control/types';
import { AuthTypeOption } from '@/react/portainer/account/git-credentials/types';
import {
  AutoUpdateResponse,
  RepoConfigResponse,
} from '@/react/portainer/gitops/types';

import { EnvVar } from '@@/form-components/EnvironmentVariablesFieldset/types';

export type StackId = number;

export enum StackType {
  /**
   * Represents a stack managed via docker stack
   */
  DockerSwarm = 1,
  /**
   * Represents a stack managed via docker-compose
   */
  DockerCompose,
  /**
   * Represents a stack managed via kubectl
   */
  Kubernetes,
}

export enum StackStatus {
  Active = 1,
  Inactive,
  Deploying,
  Error,
}

export interface StackDeploymentStatus {
  Status: StackStatus;
  Time: number;
  Message?: string;
}

/**
 * Records the deployment information of a stack, including version tracking and git configuration details
 */
export interface StackDeploymentInfo {
  /**
   * Version of the stack and also the deployed version in edge agent
   */
  Version: number;
  /**
   * Version of the stack file, used to detect changes
   */
  FileVersion: number;
  /**
   * Commit hash of the git repository used for deploying the stack
   */
  ConfigHash?: string;
  RepositoryURL?: string;
  ReferenceName?: string;
  ConfigFilePath?: string;
  AdditionalFiles?: string[];
  /**
   * Source used for deploying the stack
   */
  SourceID?: number;
}

export interface Stack {
  Id: number;
  Name: string;
  Type: StackType;
  EndpointId: number;
  SwarmId: string;
  EntryPoint: string;
  Env: EnvVar[] | null;
  ResourceControl?: ResourceControlResponse;
  Status: StackStatus;
  DeploymentStatus?: StackDeploymentStatus[];
  ProjectPath: string;
  CreationDate: number;
  CreatedBy: string;
  UpdateDate: number;
  UpdatedBy: string;
  AdditionalFiles?: string[] | null;
  AutoUpdate?: AutoUpdateResponse | null;
  Option?: {
    Prune: boolean;
    Force: boolean;
  };
  GitConfig?: RepoConfigResponse;
  GitSourceId?: number;
  FromAppTemplate: boolean;
  Namespace?: string;
  IsComposeFormat: boolean;
  Webhook?: string;
  SupportRelativePath: boolean;
  FilesystemPath: string;
  StackFileVersion: number;
  PreviousDeploymentInfo?: StackDeploymentInfo;
  CurrentDeploymentInfo?: StackDeploymentInfo;
}

export type StackFile = {
  StackFileContent: string;
};

export interface GitStackPayload {
  env: Array<EnvVar>;
  prune?: boolean;
  RepositoryReferenceName?: string;
  RepositoryAuthentication?: boolean;
  RepositoryUsername?: string;
  RepositoryPassword?: string;
  RepositoryAuthorizationType?: AuthTypeOption;
  RepullImageAndRedeploy?: boolean;
  AutoUpdate?: AutoUpdateResponse | null;
  TLSSkipVerify?: boolean;
  Registries?: number[];
  HelmChartPath?: string;
  HelmValuesFiles?: string[];
  Atomic?: boolean;
}
