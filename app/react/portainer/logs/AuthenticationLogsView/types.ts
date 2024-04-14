export enum AuthMethodType {
  Internal = 1,
  LDAP,
  OAuth,
}

export enum ActivityType {
  AuthSuccess = 1,
  AuthFailure,
  Logout,
}

export interface AuthLog {
  timestamp: number;
  context: AuthMethodType;
  id: number;
  username: string;
  type: ActivityType;
  origin: string;
}
