import { TagId } from '@/portainer/tags/types';
import { EnvironmentGroupId } from '@/react/portainer/environments/environment-groups/types';
import { DockerSnapshot } from '@/react/docker/snapshots/types';

import { Pair, TLSConfiguration } from '../settings/types';
import {
  TeamAccessPolicies,
  UserAccessPolicies,
} from '../registries/types/registry';

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
}

export type IngressClass = {
  Name: string;
  Type: string;
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
  Snapshots?: KubernetesSnapshot[] | null;
  Configuration: KubernetesConfiguration;
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

type AddonWithArgs = {
  Name: string;
  Args?: string;
};

export enum K8sDistributionType {
  MICROK8S = 'microk8s',
}

export enum KaasProvider {
  CIVO = 'civo',
  LINODE = 'linode',
  DIGITAL_OCEAN = 'digitalocean',
  GOOGLE_CLOUD = 'gke',
  AWS = 'amazon',
  AZURE = 'azure',
}

export type CloudProviderSettings = {
  Name:
    | 'Civo'
    | 'Linode'
    | 'Digital Ocean'
    | 'Google'
    | 'Azure'
    | 'Amazon'
    | 'MicroK8s';
  Provider: K8sDistributionType | KaasProvider;
  URL: string;
  Region: string | null;
  Size: number | null;
  NodeCount: number;
  CPU: number | null;
  AddonsWithArgs: AddonWithArgs[] | null;
  AmiType: number | null;
  CredentialID: number;
  DNSPrefix: string;
  HDD: number | null;
  InstanceType: string | null;
  KubernetesVersion: string;
  NetworkID: number | null;
  NodeIPs: string;
  NodeVolumeSize: number | null;
  PoolName: string;
  RAM: number | null;
  ResourceGroup: string;
  Tier: string;
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

type AzureCredentials = {
  ApplicationID: string;
  TenantID: string;
  AuthenticationKey: string;
};

/**
 * Represents an environment with all the info required to connect to it.
 */
export interface Environment {
  /**
   * Environment Identifier
   */
  Id: number;

  /**
   * Environment name
   */
  Name: string;

  /**
   * Environment type
   */
  Type: EnvironmentType;

  /**
   * URL or IP address of the Docker host associated with this environment.
   */
  URL: string;

  /**
   * Environment group identifier
   */
  GroupId: EnvironmentGroupId;

  /**
   * URL or IP address where exposed containers will be reachable
   */
  PublicURL: string;

  /**
   * List of GPU configurations associated with this environment.
   */
  Gpus: Pair[];

  /**
   * TLS configuration for connecting to the Docker host.
   */
  TLSConfig: TLSConfiguration;

  /**
   * Azure credentials if the environment is an Azure environment.
   */
  AzureCredentials?: AzureCredentials;

  /**
   * List of tag identifiers associated with this environment.
   */
  TagIds: TagId[];

  /**
   * The status of the environment (1 - up, 2 - down, 3 - provisioning, 4 - error).
   */
  Status: EnvironmentStatus;

  /**
   * A message that describes the status. Should be included for Status 3 or 4.
   */
  StatusMessage: EnvironmentStatusMessage;

  /**
   * Cloud provider information if the environment was created using KaaS provisioning.
   */
  CloudProvider?: CloudProviderSettings;

  /**
   * List of snapshots associated with this environment.
   */
  Snapshots: DockerSnapshot[];

  /**
   * User access policies for connecting to this environment.
   */
  UserAccessPolicies: UserAccessPolicies;

  /**
   * Team access policies for connecting to this environment.
   */
  TeamAccessPolicies: TeamAccessPolicies;

  /**
   * The identifier of the edge agent associated with this environment.
   */
  EdgeID?: string;

  /**
   * The key used to map the agent to Portainer.
   */
  EdgeKey: string;

  /**
   * Associated Kubernetes data.
   */
  Kubernetes: KubernetesSettings;

  /**
   * Maximum version of docker-compose.
   */
  ComposeSyntaxMaxVersion: string;

  /**
   * Environment-specific security settings.
   */
  SecuritySettings: EnvironmentSecuritySettings;

  /**
   * The identifier of the AMT Device associated with this environment.
   */
  AMTDeviceGUID?: string;

  /**
   * Mark last check-in date on check-in.
   */
  LastCheckInDate: number;

  /**
   * Query date of each query with the endpoints list.
   */
  QueryDate: number;

  /**
   * Heartbeat status of an edge environment.
   */
  Heartbeat: boolean;

  /**
   * Whether the device has been trusted by the user.
   */
  UserTrusted: boolean;

  /**
   * The check-in interval for the edge agent (in seconds).
   */
  EdgeCheckinInterval: number;

  /**
   * Edge settings for the environment.
   */
  Edge: EnvironmentEdge;

  /**
   * Agent data for the environment.
   */
  Agent: { Version?: string; PreviousVersion?: string };

  /**
   * Local time zone of the endpoint.
   */
  LocalTimeZone: string;

  /**
   * Change window restriction for GitOps updates.
   */
  ChangeWindow: EndpointChangeWindow;

  /**
   * Deployment options for the environment.
   */
  DeploymentOptions?: DeploymentOptions;

  /**
   * Enable image notification for the environment.
   */
  EnableImageNotification: boolean;

  /**
   * Enable GPU management for the environment.
   */
  EnableGPUManagement: boolean;
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

export enum PlatformType {
  Docker,
  Kubernetes,
  Azure,
}
