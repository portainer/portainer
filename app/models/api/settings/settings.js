function SettingsViewModel(data) {
  this.TemplatesURL = data.TemplatesURL;
  this.StackTemplatesURL = data.StackTemplatesURL;
  this.LogoURL = data.LogoURL;
  this.BlackListedLabels = data.BlackListedLabels;
  this.DisplayExternalContributors = data.DisplayExternalContributors;
  this.AuthenticationMethod = data.AuthenticationMethod;
  this.LDAPSettings = data.LDAPSettings;
  this.AllowBindMountsForRegularUsers = data.AllowBindMountsForRegularUsers;
  this.AllowPrivilegedModeForRegularUsers = data.AllowPrivilegedModeForRegularUsers;
}
