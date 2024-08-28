import { TeamId } from '@/react/portainer/users/teams/types';

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

type Feature = string;

export interface DefaultRegistry {
  Hide: boolean;
}

export interface ExperimentalFeatures {
  OpenAIIntegration: boolean;
}

export interface Settings {
  LogoURL: string;
  CustomLoginBanner: string;
  BlackListedLabels: Pair[];
  AuthenticationMethod: AuthenticationMethod;
  InternalAuthSettings: { RequiredPasswordLength: number };
  LDAPSettings: LDAPSettings;
  OAuthSettings: OAuthSettings;
  openAMTConfiguration: OpenAMTConfiguration;
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
  ExperimentalFeatures?: ExperimentalFeatures;
  AllowVolumeBrowserForRegularUsers: boolean;
  AllowBindMountsForRegularUsers: boolean;
  AllowPrivilegedModeForRegularUsers: boolean;
  AllowHostNamespaceForRegularUsers: boolean;
  AllowStackManagementForRegularUsers: boolean;
  AllowDeviceMappingForRegularUsers: boolean;
  AllowContainerCapabilitiesForRegularUsers: boolean;
  GlobalDeploymentOptions?: GlobalDeploymentOptions;
  Edge: {
    PingInterval: number;
    SnapshotInterval: number;
    CommandInterval: number;
    AsyncMode: boolean;
    TunnelServerAddress: string;
  };
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

export interface PublicSettingsResponse {
  /** URL to a logo that will be displayed on the login page as well as on top of the sidebar. Will use default Portainer logo when value is empty string  */
  LogoURL: string;
  /** The content in plaintext used to display in the login page. Will hide when value is empty string (only on BE) */
  CustomLoginBanner: string;
  /** Active authentication method for the Portainer instance. Valid values are: 1 for internal, 2 for LDAP, or 3 for oauth */
  AuthenticationMethod: AuthenticationMethod;
  /** The minimum required length for a password of any user when using internal auth mode */
  RequiredPasswordLength: number;
  /** Deployment options for encouraging deployment as code (only on BE) */
  GlobalDeploymentOptions: GlobalDeploymentOptions;
  /** Whether edge compute features are enabled */
  EnableEdgeComputeFeatures: boolean;
  /** Supported feature flags */
  Features: { [key: Feature]: boolean };
  /** The URL used for oauth login */
  OAuthLoginURI: string;
  /** The URL used for oauth logout */
  OAuthLogoutURI: string;
  /** Whether portainer internal auth view will be hidden (only on BE) */
  OAuthHideInternalAuth: boolean;
  /** Whether telemetry is enabled */
  EnableTelemetry: boolean;
  /** The expiry of a Kubeconfig */
  KubeconfigExpiry: string;
  /** Whether team sync is enabled */
  TeamSync: boolean;
  /** Whether AMT is enabled */
  IsAMTEnabled: boolean;
  /** Whether to hide default registry (only on BE) */
  DefaultRegistry?: {
    Hide: boolean;
  };
  Edge: {
    /** Whether the device has been started in edge async mode */
    AsyncMode: boolean;
    /** The ping interval for edge agent - used in edge async mode [seconds] */
    PingInterval: number;
    /** The snapshot interval for edge agent - used in edge async mode [seconds] */
    SnapshotInterval: number;
    /** The command list interval for edge agent - used in edge async mode [seconds] */
    CommandInterval: number;
    /** The check in interval for edge agent (in seconds) - used in non async mode [seconds] */
    CheckinInterval: number;
  };
}
