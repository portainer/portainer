import {
  TeamAccessPolicies,
  UserAccessPolicies,
} from '@/react/portainer/environments/types';

export type NamespaceAccess = {
  id: number;
  name: string;
  type: 'user' | 'team';
};

export type EnvironmentAccess = NamespaceAccess & {
  role: { name: string; id: number };
};

export interface NamespaceAccesses {
  UserAccessPolicies?: UserAccessPolicies;
  TeamAccessPolicies?: TeamAccessPolicies;
}

export interface NamespaceAccessesMap {
  [key: string]: NamespaceAccesses;
}
