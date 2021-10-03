import controller from './ldap-custom-group-search.controller';

export const ldapCustomGroupSearch = {
  templateUrl: './ldap-custom-group-search.html',
  controller,
  bindings: {
    settings: '=',
    onSearchClick: '<',
    limitedFeatureId: '<',
  },
};
