import './ldap-custom-admin-group.css';
import controller from './ldap-custom-admin-group.controller';

export const ldapCustomAdminGroup = {
  templateUrl: './ldap-custom-admin-group.html',
  controller,
  bindings: {
    settings: '=',
    selectedAdminGroups: '=',
    defaultAdminGroupSearchFilter: '<',
    onSearchClick: '<',
    limitedFeatureId: '<',
    isLimitedFeatureSelfContained: '<',
  },
};
