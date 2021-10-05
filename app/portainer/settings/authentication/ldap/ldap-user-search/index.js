import controller from './ldap-user-search.controller';

export const ldapUserSearch = {
  templateUrl: './ldap-user-search.html',
  controller,
  bindings: {
    settings: '=',
    domainSuffix: '@',
    showUsernameFormat: '<',
    baseFilter: '@',
    limitedFeatureId: '<',

    onSearchClick: '<',
  },
};
