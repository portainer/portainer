import controller from './ldap-user-search-item.controller';

export const ldapUserSearchItem = {
  templateUrl: './ldap-user-search-item.html',
  controller,
  bindings: {
    config: '=',
    index: '<',
    showUsernameFormat: '<',
    domainSuffix: '@',
    baseFilter: '@',
    onRemoveClick: '<',
    limitedFeatureId: '<',
  },
};
