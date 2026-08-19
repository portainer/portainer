import { AccessControlFormData } from '@/react/portainer/access-control/types';
import { PortainerResponse } from '@/react/docker/types';

import { PortMapping } from './container-instances/CreateView/PortsMappingField';

type OS = 'Linux' | 'Windows';

export interface ContainerInstanceFormValues {
  name: string;
  location?: string;
  subscription?: string;
  resourceGroup?: string;
  image: string;
  os: OS;
  memory: number;
  cpu: number;
  ports: PortMapping[];
  allocatePublicIP: boolean;
  accessControl: AccessControlFormData;
  env: { name: string; value: string }[];
}

interface Container {
  name: string;
  properties: {
    environmentVariables?: {
      name: string;
      value: string;
      secureValue?: string;
    }[];
    image: string;
    ports: { port: number }[];
    resources: {
      cpu: number;
      memoryInGB: number;
    };
  };
}

interface ContainerGroupProperties {
  containers: (Container | undefined)[];
  instanceView: {
    events: unknown[];
    state: 'pending' | string;
  };
  ipAddress: {
    dnsNameLabelReusePolicy: string;
    ports: { port: number; protocol: 'TCP' | 'UDP' }[];
    type: 'Public' | 'Private';
    ip: string;
  };
  osType: OS;
}

export type ContainerGroup = PortainerResponse<{
  id: string;
  name: string;
  location: string;
  type: string;
  properties: ContainerGroupProperties;
}>;

export interface Subscription {
  subscriptionId: string;
  displayName: string;
}

export interface ResourceGroup {
  id: string;
  name: string;
  location: string;
  subscriptionId: string;
}

export interface ProviderViewModel {
  id: string;
  namespace: string;
  locations: string[];
}
