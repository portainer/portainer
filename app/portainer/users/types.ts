import { EnvironmentId } from '../environments/types';

export type UserId = number;

export enum Role {
  Admin = 1,
  Standard,
}

interface AuthorizationMap {
  [authorization: string]: boolean;
}

export type User = {
  Id: UserId;
  Username: string;
  Role: Role;
  EndpointAuthorizations: {
    [endpointId: EnvironmentId]: AuthorizationMap;
  };
  // UserTheme: string;
  // this.EndpointAuthorizations = data.EndpointAuthorizations;
  // this.PortainerAuthorizations = data.PortainerAuthorizations;
  // if (data.Role === 1) {
  //   this.RoleName = 'administrator';
  // } else {
  //   this.RoleName = 'user';
  // }
  // this.AuthenticationMethod = data.AuthenticationMethod;
  // this.Checked = false;
  // this.EndpointAuthorizations = data.EndpointAuthorizations;
};
