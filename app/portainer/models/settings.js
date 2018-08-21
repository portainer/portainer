/* exported SettingsViewModel, LDAPSettingsViewModel, LDAPSearchSettings, LDAPGroupSearchSettings */

function SettingsViewModel(data) {
  this.LogoURL = data.LogoURL;
  this.BlackListedLabels = data.BlackListedLabels;
  this.AuthenticationMethod = data.AuthenticationMethod;
  this.LDAPSettings = data.LDAPSettings;
  this.AllowBindMountsForRegularUsers = data.AllowBindMountsForRegularUsers;
  this.AllowPrivilegedModeForRegularUsers = data.AllowPrivilegedModeForRegularUsers;
  this.SnapshotInterval = data.SnapshotInterval;
  this.TemplatesURL = data.TemplatesURL;
  this.ExternalTemplates = data.ExternalTemplates;
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
