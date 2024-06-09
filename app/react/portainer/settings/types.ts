import { TeamId } from '@/react/portainer/users/teams/types';

export interface FDOConfiguration {
  enabled: boolean;
  ownerURL: string;
  ownerUsername: string;
  ownerPassword: string;
}

export interface TLSConfiguration {
  TLS: boolean;
  TLSSkipVerify: boolean;
  TLSCACert?: string;
  TLSCert?: string;
  TLSKey?: string;
}

export interface LDAPGroupSearchSettings {
  GroupBaseDN: string;
  GroupFilter: string;
  GroupAttribute: string;
}

export interface LDAPSearchSettings {
  BaseDN: string;
  Filter: string;
  UserNameAttribute: string;
}

export interface LDAPSettings {
  AnonymousMode: boolean;
  ReaderDN: string;
  Password?: string;
  URL: string;
  TLSConfig: TLSConfiguration;
  StartTLS: boolean;
  SearchSettings: LDAPSearchSettings[];
  GroupSearchSettings: LDAPGroupSearchSettings[];
  AutoCreateUsers: boolean;
}

export interface Pair {
  name: string;
  value?: string;
}

export interface OpenAMTConfiguration {
  enabled: boolean;
  mpsServer: string;
  mpsUser: string;
  mpsPassword: string;
  mpsToken: string;
  certFileName: string;
  certFileContent: string;
  certFilePassword: string;
  domainName: string;
}

export interface OAuthSettings {
  ClientID: string;
  ClientSecret?: string;
  AccessTokenURI: string;
  AuthorizationURI: string;
  ResourceURI: string;
  RedirectURI: string;
  UserIdentifier: string;
  Scopes: string;
  OAuthAutoCreateUsers: boolean;
  DefaultTeamID: TeamId;
  SSO: boolean;
  LogoutURI: string;
  KubeSecretKey: string;
}

export enum AuthenticationMethod {
  /**
   * Internal represents the internal authentication method (authentication against Portainer API)
   */
  Internal = 1,
  /**
   * LDAP represents the LDAP authentication method (authentication against a LDAP server)
   */
  LDAP,
  /**
   * OAuth represents the OAuth authentication method (authentication against a authorization server)
   */
  OAuth,
  /**
   * AD represents the Active Directory authentication method (authentication against a Microsoft Active Directory server)
   */
  AD,
}

/**
 * The definition are based on oauth2 lib definition @https://pkg.go.dev/golang.org/x/oauth2#AuthStyle
 */
export enum OAuthStyle {
  AutoDetect = 0,
  InParams,
  InHeader,
}

export type Feature = string;

export interface DefaultRegistry {
  Hide: boolean;
}

export interface ExperimentalFeatures {
  OpenAIIntegration: boolean;
}

export interface InternalAuthSettings {
  RequiredPasswordLength: number;
}

export interface EdgeSettings {
  PingInterval: number;
  SnapshotInterval: number;
  CommandInterval: number;
  AsyncMode: boolean;
  TunnelServerAddress: string;
}

export interface Settings {
  LogoURL: string;
  CustomLoginBanner: string;
  BlackListedLabels: Pair[];
  AuthenticationMethod: AuthenticationMethod;
  InternalAuthSettings: InternalAuthSettings;
  LDAPSettings: LDAPSettings;
  OAuthSettings: OAuthSettings;
  openAMTConfiguration: OpenAMTConfiguration;
  fdoConfiguration: FDOConfiguration;
  Features: { [key: Feature]: boolean };
  SnapshotInterval: string;
  TemplatesURL: string;
  EnableEdgeComputeFeatures: boolean;
  UserSessionTimeout: string;
  KubeconfigExpiry: string;
  EnableTelemetry: boolean;
  HelmRepositoryURL: string;
  KubectlShellImage: string;
  TrustOnFirstConnect: boolean;
  EnforceEdgeID: boolean;
  AgentSecret: string;
  EdgePortainerUrl: string;
  EdgeAgentCheckinInterval: number;
  DefaultRegistry: DefaultRegistry;
  ExperimentalFeatures?: ExperimentalFeatures;
  GlobalDeploymentOptions?: GlobalDeploymentOptions;
  Edge: EdgeSettings;
}

export interface GlobalDeploymentOptions {
  /** Hide manual deploy forms in portainer */
  hideAddWithForm: boolean;
  /** Configure this per environment or globally */
  perEnvOverride: boolean;
  /** Hide the web editor in the remaining visible forms */
  hideWebEditor: boolean;
  /** Hide the file upload option in the remaining visible forms */
  hideFileUpload: boolean;
  /** Make note on application add/edit screen required */
  requireNoteOnApplications: boolean;
  minApplicationNoteLength: number;

  hideStacksFunctionality: boolean;
}
