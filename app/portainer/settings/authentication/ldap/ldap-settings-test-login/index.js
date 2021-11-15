import './ldap-settings-test-login.css';
import controller from './ldap-settings-test-login.controller';

export const ldapSettingsTestLogin = {
  templateUrl: './ldap-settings-test-login.html',
  controller,
  bindings: {
    settings: '=',
    limitedFeatureId: '<',
    showBeIndicatorIfNeeded: '<',
    isLimitedFeatureSelfContained: '<',
  },
};
