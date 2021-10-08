import controller from './ldap-custom-user-search.controller';

export const ldapCustomUserSearch = {
  templateUrl: './ldap-custom-user-search.html',
  controller,
  bindings: {
    settings: '=',
    onSearchClick: '<',
    limitedFeatureId: '<',
  },
};
