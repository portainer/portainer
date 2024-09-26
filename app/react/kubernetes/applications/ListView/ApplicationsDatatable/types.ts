import { AppType, DeploymentType } from '../../types';

export interface Application {
  Id: string;
  Name: string;
  Image: string;
  Containers?: Array<unknown>;
  Services?: Array<unknown>;
  CreationDate: string;
  ApplicationOwner?: string;
  StackName?: string;
  ResourcePool: string;
  ApplicationType: AppType;
  KubernetesApplications?: Array<Application>;
  Metadata?: {
    labels: Record<string, string>;
  };
  Status: 'Ready' | string;
  TotalPodsCount: number;
  RunningPodsCount: number;
  DeploymentType: DeploymentType;
  Pods?: Array<{
    Status: string;
  }>;
  Configurations?: Array<{
    Data?: object;
    Kind: ConfigKind;
    ConfigurationOwner: string;
  }>;
  LoadBalancerIPAddress?: string;
  PublishedPorts?: Array<{
    IngressRules: Array<{
      Host: string;
      IP: string;
      Path: string;
      TLS: Array<{
        hosts: Array<string>;
      }>;
    }>;
    Port: number;
  }>;
  Resource?: {
    CpuLimit?: number;
    CpuRequest?: number;
    MemoryLimit?: number;
    MemoryRequest?: number;
  };
}

export enum ConfigKind {
  ConfigMap = 1,
  Secret,
}
