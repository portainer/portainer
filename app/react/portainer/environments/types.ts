import { TagId } from '@/portainer/tags/types';
import { EnvironmentGroupId } from '@/react/portainer/environments/environment-groups/types';
import { Job } from '@/react/nomad/types';
import { DockerSnapshot } from '@/react/docker/snapshots/types';

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
  // EdgeAgentOnNomad represents an environment(endpoint) connected to an Edge agent deployed on a Nomad environment(endpoint)
  EdgeAgentOnNomad,
}

export const EdgeTypes = [
  EnvironmentType.EdgeAgentOnDocker,
  EnvironmentType.EdgeAgentOnKubernetes,
  EnvironmentType.EdgeAgentOnNomad,
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
}

export type IngressClass = {
  Name: string;
  Type: string;
};

interface StorageClass {
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
  RestrictStandardUserIngressW?: boolean;
  IngressClasses: IngressClass[];
  IngressAvailabilityPerNamespace: boolean;
  AllowNoneIngressClass: boolean;
}

export interface KubernetesSettings {
  Snapshots?: KubernetesSnapshot[] | null;
  Configuration: KubernetesConfiguration;
}

export interface NomadSnapshot {
  JobCount: number;
  GroupCount: number;
  TaskCount: number;
  RunningTaskCount: number;
  NodeCount: number;
  Time: number;
  Jobs: Job[];
}

export interface NomadSettings {
  Snapshots: NomadSnapshot[];
}

export type EnvironmentEdge = {
  AsyncMode: boolean;
  PingInterval: number;
  SnapshotInterval: number;
  CommandInterval: number;
};

export interface EnvironmentSecuritySettings {
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

export type DeploymentOptions = {
  overrideGlobalOptions: boolean;
  hideAddWithForm: boolean;
  hideWebEditor: boolean;
  hideFileUpload: boolean;
};

/**
 *  EndpointChangeWindow determine when GitOps stack/app updates may occur
 */
interface EndpointChangeWindow {
  Enabled: boolean;
  StartTime: string;
  EndTime: string;
}
export interface EnvironmentStatusMessage {
  summary: string;
  detail: string;
}

export type Environment = {
  Agent: { Version: string };
  Id: EnvironmentId;
  Type: EnvironmentType;
  TagIds: TagId[];
  GroupId: EnvironmentGroupId;
  DeploymentOptions: DeploymentOptions | null;
  EnableGPUManagement: boolean;
  EdgeID?: string;
  EdgeKey: string;
  EdgeCheckinInterval?: number;
  QueryDate?: number;
  Heartbeat?: boolean;
  LastCheckInDate?: number;
  Name: string;
  Status: EnvironmentStatus;
  URL: string;
  Snapshots: DockerSnapshot[];
  Kubernetes: KubernetesSettings;
  Nomad: NomadSettings;
  PublicURL?: string;
  UserTrusted: boolean;
  AMTDeviceGUID?: string;
  Edge: EnvironmentEdge;
  SecuritySettings: EnvironmentSecuritySettings;
  Gpus: { name: string; value: string }[];
  EnableImageNotification: boolean;
  LocalTimeZone?: string;

  /** GitOps update change window restriction for stacks and apps */
  ChangeWindow: EndpointChangeWindow;
  /**
   *  A message that describes the status. Should be included for Status Provisioning or Error.
   */
  StatusMessage?: EnvironmentStatusMessage;
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
  KubeConfigEnvironment,
}

export enum PlatformType {
  Docker,
  Kubernetes,
  Azure,
  Nomad,
}
