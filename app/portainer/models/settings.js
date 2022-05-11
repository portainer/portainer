export function SettingsViewModel(data) {
  this.LogoURL = data.LogoURL;
  this.BlackListedLabels = data.BlackListedLabels;
  this.AuthenticationMethod = data.AuthenticationMethod;
  this.LDAPSettings = data.LDAPSettings;
  this.OAuthSettings = new OAuthSettingsViewModel(data.OAuthSettings);
  this.openAMTConfiguration = data.openAMTConfiguration;
  this.fdoConfiguration = data.fdoConfiguration;
  this.SnapshotInterval = data.SnapshotInterval;
  this.TemplatesURL = data.TemplatesURL;
  this.EdgeAgentCheckinInterval = data.EdgeAgentCheckinInterval;
  this.EnableEdgeComputeFeatures = data.EnableEdgeComputeFeatures;
  this.FeatureFlagSettings = data.FeatureFlagSettings;
  this.UserSessionTimeout = data.UserSessionTimeout;
  this.EnableTelemetry = data.EnableTelemetry;
  this.KubeconfigExpiry = data.KubeconfigExpiry;
  this.HelmRepositoryURL = data.HelmRepositoryURL;
  this.TrustOnFirstConnect = data.TrustOnFirstConnect;
  this.EnforceEdgeID = data.EnforceEdgeID;
  this.AgentSecret = data.AgentSecret;
  this.EdgePortainerUrl = data.EdgePortainerUrl;
}

export function PublicSettingsViewModel(settings) {
  this.AuthenticationMethod = settings.AuthenticationMethod;
  this.EnableEdgeComputeFeatures = settings.EnableEdgeComputeFeatures;
  this.EnforceEdgeID = settings.EnforceEdgeID;
  this.FeatureFlagSettings = settings.FeatureFlagSettings;
  this.LogoURL = settings.LogoURL;
  this.OAuthLoginURI = settings.OAuthLoginURI;
  this.EnableTelemetry = settings.EnableTelemetry;
  this.OAuthLogoutURI = settings.OAuthLogoutURI;
  this.KubeconfigExpiry = settings.KubeconfigExpiry;
}

export function LDAPSettingsViewModel(data) {
  this.ReaderDN = data.ReaderDN;
  this.Password = data.Password;
  this.URL = data.URL;
  this.SearchSettings = data.SearchSettings;
  this.GroupSearchSettings = data.GroupSearchSettings;
  this.AutoCreateUsers = data.AutoCreateUsers;
}

export function LDAPSearchSettings(BaseDN, UsernameAttribute, Filter) {
  this.BaseDN = BaseDN;
  this.UsernameAttribute = UsernameAttribute;
  this.Filter = Filter;
}

export function LDAPGroupSearchSettings(GroupBaseDN, GroupAttribute, GroupFilter) {
  this.GroupBaseDN = GroupBaseDN;
  this.GroupAttribute = GroupAttribute;
  this.GroupFilter = GroupFilter;
}

export function OAuthSettingsViewModel(data) {
  this.ClientID = data.ClientID;
  this.ClientSecret = data.ClientSecret;
  this.AccessTokenURI = data.AccessTokenURI;
  this.AuthorizationURI = data.AuthorizationURI;
  this.ResourceURI = data.ResourceURI;
  this.RedirectURI = data.RedirectURI;
  this.UserIdentifier = data.UserIdentifier;
  this.Scopes = data.Scopes;
  this.OAuthAutoCreateUsers = data.OAuthAutoCreateUsers;
  this.DefaultTeamID = data.DefaultTeamID;
  this.SSO = data.SSO;
  this.LogoutURI = data.LogoutURI;
}
