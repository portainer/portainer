function SettingsViewModel(data) {
  this.TemplatesURL = data.TemplatesURL;
  this.LogoURL = data.LogoURL;
  this.BlackListedLabels = data.BlackListedLabels;
  this.DisplayDonationHeader = data.DisplayDonationHeader;
  this.DisplayExternalContributors = data.DisplayExternalContributors;
  this.AuthenticationMethod = data.AuthenticationMethod;
  this.LDAPSettings = data.LDAPSettings;
  this.AllowBindMountsForRegularUsers = data.AllowBindMountsForRegularUsers;
  this.AllowPrivilegedModeForRegularUsers = data.AllowPrivilegedModeForRegularUsers;
}
