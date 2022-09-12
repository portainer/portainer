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
  value: string;
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

enum AuthenticationMethod {
  /**
   * Internal represents the internal authentication method (authentication against Portainer API)
   */
  Internal,
  /**
   * LDAP represents the LDAP authentication method (authentication against a LDAP server)
   */
  LDAP,
  /**
   * OAuth represents the OAuth authentication method (authentication against a authorization server)
   */
  OAuth,
}

type Feature = string;

export interface DefaultRegistry {
  Hide: boolean;
}

export interface Settings {
  LogoURL: string;
  BlackListedLabels: Pair[];
  AuthenticationMethod: AuthenticationMethod;
  InternalAuthSettings: { RequiredPasswordLength: number };
  LDAPSettings: LDAPSettings;
  OAuthSettings: OAuthSettings;
  openAMTConfiguration: OpenAMTConfiguration;
  fdoConfiguration: FDOConfiguration;
  FeatureFlagSettings: { [key: Feature]: boolean };
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
  EdgeCommandInterval: number;
  EdgePingInterval: number;
  EdgeSnapshotInterval: number;
  DisplayDonationHeader: boolean;
  DisplayExternalContributors: boolean;
  EnableHostManagementFeatures: boolean;
  AllowVolumeBrowserForRegularUsers: boolean;
  AllowBindMountsForRegularUsers: boolean;
  AllowPrivilegedModeForRegularUsers: boolean;
  AllowHostNamespaceForRegularUsers: boolean;
  AllowStackManagementForRegularUsers: boolean;
  AllowDeviceMappingForRegularUsers: boolean;
  AllowContainerCapabilitiesForRegularUsers: boolean;
  Edge: {
    PingInterval: number;
    SnapshotInterval: number;
    CommandInterval: number;
    AsyncMode: boolean;
  };
}

export interface PublicSettingsResponse {
  // URL to a logo that will be displayed on the login page as well as on top of the sidebar. Will use default Portainer logo when value is empty string
  LogoURL: string;
  // Active authentication method for the Portainer instance. Valid values are: 1 for internal, 2 for LDAP, or 3 for oauth
  AuthenticationMethod: AuthenticationMethod;
  // Whether edge compute features are enabled
  EnableEdgeComputeFeatures: boolean;
  // Supported feature flags
  Features: Record<string, boolean>;
  // The URL used for oauth login
  OAuthLoginURI: string;
  // The URL used for oauth logout
  OAuthLogoutURI: string;
  // Whether portainer internal auth view will be hidden
  OAuthHideInternalAuth: boolean;
  // Whether telemetry is enabled
  EnableTelemetry: boolean;
  // The expiry of a Kubeconfig
  KubeconfigExpiry: string;
}
