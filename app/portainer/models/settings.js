function SettingsViewModel(data) {
  this.LogoURL = data.LogoURL;
  this.BlackListedLabels = data.BlackListedLabels;
  this.AuthenticationMethod = data.AuthenticationMethod;
  this.LDAPSettings = data.LDAPSettings;
  this.OAuthSettings = new OAuthSettingsViewModel(data.OAuthSettings);
  this.AllowBindMountsForRegularUsers = data.AllowBindMountsForRegularUsers;
  this.AllowPrivilegedModeForRegularUsers = data.AllowPrivilegedModeForRegularUsers;
  this.SnapshotInterval = data.SnapshotInterval;
  this.TemplatesURL = data.TemplatesURL;
  this.ExternalTemplates = data.ExternalTemplates;
  this.EnableHostManagementFeatures = data.EnableHostManagementFeatures;
}

function PublicSettingsViewModel(settings) {
  this.AllowBindMountsForRegularUsers = settings.AllowBindMountsForRegularUsers;
  this.AllowPrivilegedModeForRegularUsers = settings.AllowPrivilegedModeForRegularUsers;
  this.AuthenticationMethod = settings.AuthenticationMethod;
  this.EnableHostManagementFeatures = settings.EnableHostManagementFeatures;
  this.ExternalTemplates = settings.ExternalTemplates;
  this.LogoURL = settings.LogoURL;
  this.OAuthLoginURI = settings.OAuthLoginURI;
}

function LDAPSettingsViewModel(data) {
  this.ReaderDN = data.ReaderDN;
  this.Password = data.Password;
  this.URL = data.URL;
  this.SearchSettings = data.SearchSettings;
  this.GroupSearchSettings = data.GroupSearchSettings;
  this.AutoCreateUsers = data.AutoCreateUsers;
}

function LDAPSearchSettings(BaseDN, UsernameAttribute, Filter) {
  this.BaseDN = BaseDN;
  this.UsernameAttribute = UsernameAttribute;
  this.Filter = Filter;
}

function LDAPGroupSearchSettings(GroupBaseDN, GroupAttribute, GroupFilter) {
  this.GroupBaseDN = GroupBaseDN;
  this.GroupAttribute = GroupAttribute;
  this.GroupFilter = GroupFilter;
}

function OAuthSettingsViewModel(data) {
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
}