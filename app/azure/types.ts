import { PortMapping } from './ContainerInstances/PortsMappingField';

export interface ContainerInstanceFormValues {
  name: string;
  location: string;
  subscription: string;
  resourceGroup: string;
  image: string;
  os: string;
  memory: number;
  cpu: number;
  ports: PortMapping[];
  allocatePublicIP: boolean;
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
}

interface ResourceType {
  resourceType: 'containerGroups' | string;
  locations: string[];
}

export interface Provider {
  id: string;
  namespace: string;
  resourceTypes: ResourceType[];
}
