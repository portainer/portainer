export const ldapSettingsSecurity = {
  templateUrl: './ldap-settings-security.html',
  bindings: {
    settings: '=',
    tlscaCert: '<',
    onTlscaCertChange: '<',
    uploadInProgress: '<',
    title: '@',
    limitedFeatureId: '<',
  },
};
