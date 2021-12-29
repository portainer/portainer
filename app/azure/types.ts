import { AccessControlFormData } from '@/portainer/components/accessControlForm/model';

import { PortMapping } from './ContainerInstances/CreateContainerInstanceForm/PortsMappingField';

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
}

export interface ContainerGroup {
  name: string;
}

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

interface ResourceType {
  resourceType: 'containerGroups' | string;
  locations: string[];
}

export interface ProviderResponse {
  id: string;
  namespace: string;
  resourceTypes: ResourceType[];
}
