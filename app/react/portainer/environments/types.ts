import {
  PortainerEndpoint,
  PortainerEndpointSecuritySettings,
} from '@api/types.gen';

import { TagId } from '@/portainer/tags/types';
import { DockerSnapshot } from '@/react/docker/snapshots/types';

export type EnvironmentGroupId = number;

export type EdgeGroupId = number;

type RoleId = number;
interface AccessPolicy {
  RoleId: RoleId;
}

export type UserAccessPolicies = Record<number, AccessPolicy>; // map[UserID]AccessPolicy
export type TeamAccessPolicies = Record<number, AccessPolicy>;

export type EnvironmentId = number;

/**
 * matches portainer.EndpointType in app/portainer.go
 */
export enum EnvironmentType {
  // Docker represents an environment(endpoint) connected to a Docker environment(endpoint)
  Docker = 1,
  // AgentOnDocker represents an environment(endpoint) connected to a Portainer agent deployed on a Docker environment(endpoint)
  AgentOnDocker,
  // Azure represents an environment(endpoint) connected to an Azure environment(endpoint)
  Azure,
  // EdgeAgentOnDocker represents an environment(endpoint) connected to an Edge agent deployed on a Docker environment(endpoint)
  EdgeAgentOnDocker,
  // KubernetesLocal represents an environment(endpoint) connected to a local Kubernetes environment(endpoint)
  KubernetesLocal,
  // AgentOnKubernetes represents an environment(endpoint) connected to a Portainer agent deployed on a Kubernetes environment(endpoint)
  AgentOnKubernetes,
  // EdgeAgentOnKubernetes represents an environment(endpoint) connected to an Edge agent deployed on a Kubernetes environment(endpoint)
  EdgeAgentOnKubernetes,
}

export const EdgeTypes = [
  EnvironmentType.EdgeAgentOnDocker,
  EnvironmentType.EdgeAgentOnKubernetes,
] as const;

export enum EnvironmentStatus {
  Up = 1,
  Down,
  Provisioning,
  Error,
}

export interface KubernetesSnapshot {
  KubernetesVersion: string;
  TotalCPU: number;
  TotalMemory: number;
  Time: number;
  NodeCount: number;
  GPUNodeCount?: number;
  TotalGPU?: Record<string, number>;
}

export type IngressClass = {
  Name: string;
  Type: string;
  Blocked?: boolean;
  BlockedNamespaces?: string[];
};

export interface StorageClass {
  Name: string;
  AccessModes: string[];
  AllowVolumeExpansion: boolean;
  Provisioner: string;
}

export interface KubernetesConfiguration {
  UseLoadBalancer?: boolean;
  StorageClasses?: StorageClass[];
  UseServerMetrics?: boolean;
  EnableResourceOverCommit?: boolean;
  ResourceOverCommitPercentage?: number;
  RestrictDefaultNamespace?: boolean;
  RestrictSecrets?: boolean;
  RestrictStandardUserIngressW?: boolean;
  IngressClasses: IngressClass[];
  IngressAvailabilityPerNamespace: boolean;
  AllowNoneIngressClass: boolean;
}

export interface KubernetesSettings {
  Snapshots?: KubernetesSnapshot[];
  Configuration: KubernetesConfiguration;
  Flags: {
    IsServerMetricsDetected: boolean;
    IsServerIngressClassDetected: boolean;
    IsServerStorageDetected: boolean;
  };
}

export type EnvironmentEdge = {
  AsyncMode: boolean;
  PingInterval: number;
  SnapshotInterval: number;
  CommandInterval: number;
};

export type EnvironmentSecuritySettings = PortainerEndpointSecuritySettings;

export type DeploymentOptions = {
  overrideGlobalOptions: boolean;
  hideAddWithForm: boolean;
  hideWebEditor: boolean;
  hideFileUpload: boolean;
};

/**
 *  EndpointChangeWindow determine when GitOps stack/app updates may occur
 */
export interface EndpointChangeWindow {
  Enabled: boolean;
  StartTime: string;
  EndTime: string;
}
export interface EnvironmentStatusMessage {
  summary: string;
  detail: string;
}

type EnvironmentBase = Omit<PortainerEndpoint, 'Status'>;

export interface Environment extends EnvironmentBase {
  Status: EnvironmentStatus;
  Type: EnvironmentType;
  ContainerEngine: ContainerEngine;

  TagIds: TagId[];
  Snapshots: DockerSnapshot[];
  Agent: { Version: string; IsOutdated?: boolean };
  Edge: EnvironmentEdge;
  EnableGPUManagement: boolean;
  Kubernetes: KubernetesSettings;

  // Fields not in CE PortainerEndpoint (EE-only in server)
  LocalTimeZone?: string;
  EnableImageNotification: boolean;
  ChangeWindow: EndpointChangeWindow;
  DeploymentOptions: DeploymentOptions | null;
  StatusMessage?: EnvironmentStatusMessage;
}

/**
 * TS reference of endpoint_create.go#EndpointCreationType iota
 */
export enum EnvironmentCreationTypes {
  LocalDockerEnvironment = 1,
  AgentEnvironment,
  AzureEnvironment,
  EdgeAgentEnvironment,
  LocalKubernetesEnvironment,
  KubeConfigEnvironment,
}

export enum ContainerEngine {
  Docker = 'docker',
  Podman = 'podman',
  // an empty container engine means that the endpoint is a Kubernetes endpoint
  Kubernetes = '',
}

export enum PlatformType {
  Docker,
  Kubernetes,
  Azure,
  Podman,
}

export enum EnvironmentHealth {
  Down,
  Outdated,
  Up,
  Heartbeat,
}
