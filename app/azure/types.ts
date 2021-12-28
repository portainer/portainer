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
