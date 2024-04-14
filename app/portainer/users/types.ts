import { EnvironmentId } from '@/react/portainer/environments/types';
import { AuthorizationMap } from '@/react/portainer/users/RolesView/types';

import { type UserId } from './types/user-id';

export { type UserId };

export enum Role {
  Admin = 1,
  Standard,
  EdgeAdmin,
}

export const RoleNames: { [key in Role]: string } = {
  [Role.Admin]: 'administrator',
  [Role.Standard]: 'user',
  [Role.EdgeAdmin]: 'edge administrator',
};

export type User = {
  Id: UserId;
  Username: string;
  Role: Role;
  EndpointAuthorizations: {
    [endpointId: EnvironmentId]: AuthorizationMap;
  };
  UseCache: boolean;
  ThemeSettings: {
    color: 'dark' | 'light' | 'highcontrast' | 'auto';
  };
};
