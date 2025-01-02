import { ResourceControlResponse } from '@/react/portainer/access-control/types';
import {
  AutoUpdateResponse,
  RepoConfigResponse,
} from '@/react/portainer/gitops/types';

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

export interface Stack {
  Id: number;
  Name: string;
  Type: StackType;
  EndpointId: number;
  SwarmId: string;
  EntryPoint: string;
  Env: {
    name: string;
    value: string;
  }[];
  ResourceControl?: ResourceControlResponse;
  Status: StackStatus;
  ProjectPath: string;
  CreationDate: number;
  CreatedBy: string;
  UpdateDate: number;
  UpdatedBy: string;
  AdditionalFiles?: string[];
  AutoUpdate?: AutoUpdateResponse;
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
  StackFileVersion: string;
  PreviousDeploymentInfo: unknown;
}

export type StackFile = {
  StackFileContent: string;
};
