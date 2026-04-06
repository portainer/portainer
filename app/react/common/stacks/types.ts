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
  FromAppTemplate: boolean;
  Namespace?: string;
  IsComposeFormat: boolean;
  Webhook?: string;
  SupportRelativePath: boolean;
  FilesystemPath: string;
  StackFileVersion: number;
  PreviousDeploymentInfo?: StackDeploymentInfo;
}

export type StackFile = {
  StackFileContent: string;
};

export interface GitStackPayload {
  env: Array<EnvVar> | null;
  prune?: boolean;
  RepositoryReferenceName?: string;
  RepositoryAuthentication?: boolean;
  RepositoryGitCredentialID?: number;
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
