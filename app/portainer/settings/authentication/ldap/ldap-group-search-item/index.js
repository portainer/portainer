import controller from './ldap-group-search-item.controller';

export const ldapGroupSearchItem = {
  templateUrl: './ldap-group-search-item.html',
  controller,
  bindings: {
    config: '=',
    index: '<',
    domainSuffix: '@',
    baseFilter: '@',

    onRemoveClick: '<',
    limitedFeatureId: '<',
  },
};
