export interface AuthorizationMap {
  [authorization: string]: boolean;
}

export interface RbacRole {
  Id: number;
  Name: string;
  Description: string;
  Authorizations: AuthorizationMap;
  Priority: number;
}
