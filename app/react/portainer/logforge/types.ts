import { EnvironmentId } from '../environments/types';

export interface LogForgeHealth {
  Status: 'not_configured' | 'healthy' | 'unhealthy' | string;
  Message?: string;
  StatusCode?: number;
  Version?: string;
  CheckedAt?: number;
}

export interface LogForgeStackSummary {
  Id: number;
  Name: string;
  EndpointId: EnvironmentId;
  Status: number;
}

export interface LogForgeEndpointScope {
  Id: EnvironmentId;
  Name: string;
  Role: 'admin' | 'write' | 'read_only' | string;
  RoleId?: number;
}

export interface LogForgeAccess {
  Allowed: boolean;
  IsAdmin: boolean;
  UserId?: number;
  Username?: string;
  TeamIds?: number[];
  Endpoints?: LogForgeEndpointScope[];
}

export interface LogForgeStatus {
  Enabled: boolean;
  Managed: boolean;
  ApplianceStackId?: number;
  ApplianceEndpointId?: EnvironmentId;
  ApplianceUrl?: string;
  ApplianceHostHeader?: string;
  TLSSkipVerify: boolean;
  BrowserProxyPath: string;
  ApplianceImage?: string;
  StackName?: string;
  PortainerInstanceId?: string;
  ServiceKeyPrefix?: string;
  ServiceKeyCreatedAt?: number;
  ServiceKeyLastUsedAt?: number;
  ServiceKeyRotatedAt?: number;
  ManagedAuthReady: boolean;
  Stack?: LogForgeStackSummary;
  Health: LogForgeHealth;
  Access: LogForgeAccess;
}

export interface LogForgeInstallPayload {
  EndpointId?: EnvironmentId;
  ApplianceUrl?: string;
  ApplianceHostHeader?: string;
  TLSSkipVerify?: boolean;
  Image?: string;
  StackName?: string;
  CentralFQDN?: string;
  HTTPSPort?: number;
  MTLSPort?: number;
  RemoteAgentImage?: string;
}

export interface LogForgeUninstallPayload {
  RemoveManagedStack: boolean;
}
