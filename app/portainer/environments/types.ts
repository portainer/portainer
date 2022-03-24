import { TagId } from '@/portainer/tags/types';
import { EnvironmentGroupId } from '@/portainer/environment-groups/types';

export type EnvironmentId = number;

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

export enum EnvironmentStatus {
  Up = 1,
  Down,
}

export interface DockerSnapshot {
  TotalCPU: number;
  TotalMemory: number;
  NodeCount: number;
  ImageCount: number;
  VolumeCount: number;
  RunningContainerCount: number;
  StoppedContainerCount: number;
  HealthyContainerCount: number;
  UnhealthyContainerCount: number;
  Time: number;
  StackCount: number;
  ServiceCount: number;
  Swarm: boolean;
  DockerVersion: string;
}

export interface KubernetesSnapshot {
  KubernetesVersion: string;
  TotalCPU: number;
  TotalMemory: number;
  Time: number;
  NodeCount: number;
}

export interface KubernetesSettings {
  Snapshots?: KubernetesSnapshot[] | null;
}

export type Environment = {
  Id: EnvironmentId;
  Type: EnvironmentType;
  TagIds: TagId[];
  GroupId: EnvironmentGroupId;
  EdgeID?: string;
  EdgeCheckinInterval?: number;
  QueryDate?: number;
  LastCheckInDate?: number;
  Name: string;
  Status: EnvironmentStatus;
  URL: string;
  Snapshots: DockerSnapshot[];
  Kubernetes: KubernetesSettings;
  PublicURL?: string;
  IsEdgeDevice?: boolean;
  UserTrusted: boolean;
  AMTDeviceGUID?: string;
};

/**
 * TS reference of endpoint_create.go#EndpointCreationType iota
 */
export enum EnvironmentCreationTypes {
  LocalDockerEnvironment = 1,
  AgentEnvironment,
  AzureEnvironment,
  EdgeAgentEnvironment,
  LocalKubernetesEnvironment,
}

export enum PlatformType {
  Docker,
  Kubernetes,
  Azure,
}

export interface EnvironmentSettings {
  // Whether non-administrator should be able to use bind mounts when creating containers
  allowBindMountsForRegularUsers: boolean;
  // Whether non-administrator should be able to use privileged mode when creating containers
  allowPrivilegedModeForRegularUsers: boolean;
  // Whether non-administrator should be able to browse volumes
  allowVolumeBrowserForRegularUsers: boolean;
  // Whether non-administrator should be able to use the host pid
  allowHostNamespaceForRegularUsers: boolean;
  // Whether non-administrator should be able to use device mapping
  allowDeviceMappingForRegularUsers: boolean;
  // Whether non-administrator should be able to manage stacks
  allowStackManagementForRegularUsers: boolean;
  // Whether non-administrator should be able to use container capabilities
  allowContainerCapabilitiesForRegularUsers: boolean;
  // Whether non-administrator should be able to use sysctl settings
  allowSysctlSettingForRegularUsers: boolean;
  // Whether host management features are enabled
  enableHostManagementFeatures: boolean;
}
