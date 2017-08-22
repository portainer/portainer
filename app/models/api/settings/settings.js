function SettingsViewModel(data) {
  this.TemplatesURL = data.TemplatesURL;
  this.LogoURL = data.LogoURL;
  this.BlackListedLabels = data.BlackListedLabels;
  this.DisplayExternalContributors = data.DisplayExternalContributors;
  this.AuthenticationMethod = data.AuthenticationMethod;
  this.LDAPSettings = data.LDAPSettings;
  this.Language = data.Language;
}
