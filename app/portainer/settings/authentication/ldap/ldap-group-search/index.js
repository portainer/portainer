import controller from './ldap-group-search.controller';

export const ldapGroupSearch = {
  templateUrl: './ldap-group-search.html',
  controller,
  bindings: {
    settings: '=',
    domainSuffix: '@',
    baseFilter: '@',

    onSearchClick: '<',
    limitedFeatureId: '<',
  },
};
